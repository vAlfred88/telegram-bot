const axios = require('axios')
const functions = require('firebase-functions')
// const moment = require('moment')
const {Telegraf} = require('telegraf')
const {initializeApp} = require('firebase/app')
const {getFirestore} = require('firebase/firestore')
const {doc, setDoc, getDoc} = require('firebase/firestore')

const firebaseConfig = {
    apiKey: functions.config().app.firebase.key,
    authDomain: functions.config().app.firebase.domain,
    databaseURL: functions.config().app.firebase.url,
    projectId: functions.config().app.firebase.project,
    storageBucket: functions.config().app.firebase.bucket,
    messagingSenderId: functions.config().app.firebase.sender,
    appId: functions.config().app.firebase.id,
}

initializeApp(firebaseConfig)
const db = getFirestore()

const bot = new Telegraf(functions.config().telegram.token, {
    telegram: {webhookReply: true},
})

const v = 5.131
const ownerId = functions.config().vk.owner

async function load() {
    let data
    const response = await axios.get('https://api.vk.com/method/wall.get', {
        params: {
            access_token: functions.config().vk.token,
            owner_id: ownerId,
            count: 10,
            v,
        },
    }).then(async (response) => {
        data = response.data.response.items
        return true
    }).catch((e) => {
        console.log(e)
        return false
    })
    if (response) {
        return data
    }
}

async function check(item, ctx = null) {
    const docSnap = await getDoc(doc(db, 'posts', `vk-${item.id}`))
    if (!docSnap.exists()) {
        await setDoc(doc(db, 'posts', `vk-${item.id}`), {
            post_id: item.id,
        })
        await sendMessage(item, ctx)
    }
}

async function sendMessage(item, ctx) {
    const url = `https://vk.com/wall${ownerId}_${item.id}`
    const text = `${item.text} \n ${url}`
    if (ctx) {
        ctx.reply(text)
        return
    }
    await bot.telegram.sendMessage(-1001284345066, text)
}

exports.scheduledFunction = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
    const items = await load()
    for (const item of items.reverse()) {
        await check(item)
    }
    return null
})

// bot.hears('vk', async (ctx) => {
//     const items = await load()
//     for (const item of items.reverse()) {
//         await check(item, ctx)
//     }
//     return null
// })

// error handling
bot.catch((err, ctx) => {
    functions.logger.error('[Bot] Error', err)
    return ctx.reply(`Ooops, encountered an error for ${ctx.updateType}`, err)
})

// initialize the commands
// bot.command('/start', (ctx) => ctx.reply('Hello! Send any message and I will copy it.'))
// bot.on('sticker', (ctx) => ctx.reply('👍'))

// handle all telegram updates with HTTPs trigger
exports.echoBot = functions.https.onRequest(async (request, response) => {
    return bot.handleUpdate(request.body, response)
})
