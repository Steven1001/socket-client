const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app)
const io = require('socket.io-client')
const db = require('./mysql-config')
const PORT = 3020
const cors = require('cors')
const bodyParser = require('body-parser')
const axios = require('axios');

var msgCount = 0

const startServer = async() => {
    app.use(cors())
    app.use(bodyParser.json({limit: '2000mb'}))
    app.use(express.urlencoded({extended: true}));

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    app.post('/testing', async (req, res) => {
        try{
            const limit = req.body.limit
            const text = req.body.text

            const apiUrl = 'http://192.168.1.242:3040/await-test'

            const paramsList = []
            for(let index = 0; index < limit; index++){
                const params = {
                    data: {
                        text: `${text} (${index})`
                    }
                }
                paramsList.push(params)
            }

            Promise.all(paramsList.map(async (params) => {
                const response = await axios.post(apiUrl, params.data);
            }));

            // for(let index = 0; index < paramsList.length; index++){
            //     await delay(100)
            //     const response = await axios.post(apiUrl, paramsList[index].data, paramsList[index].header);
            // }
            
        }catch(error){
            console.log(error.message)
        }
        res.send(`Send message.`)
    })

    app.post('/aws/socket', async (req, res) => {
        try{
            const startId = req.body.startId
            const userLimit = req.body.userLimit
            
            const serverUrl = 'https://galaxyyouknowsocial.net'
            const inputQuery = `SELECT * FROM user_info WHERE id >= ? LIMIT ${userLimit}`
            const users = await db.query(inputQuery, [startId])

            if (users?.length){
                for(let index = 0; index<users.length; index++){
                    console.log(index)
                    await delay(100)
                    const options = {
                        transports: ['websocket'],
                        extraHeaders: {
                        'token': `Bearer ${users[index].access_token}`,
                        'userid': `${users[index].user_id}`
                        }
                    }
                
                    const socket = io.connect(serverUrl, options)
                    
                    socket.on('CHAT_OPERATION_EVENT', (incommingMsg) => {
                        msgCount++
                        console.log(`${msgCount} -- ${incommingMsg.data.message[0].messageInfo[0].mediaData.content.data.text}`)
                        // console.log('Received message: ', incommingMsg.data.message[0].messageInfo[0].mediaData.content.data.text)
                    });
                    
                    socket.on('disconnect', () => {
                        console.log('Server closed the connection')
                    });
                }
                console.log(`Connecting ${users.length} socket clients started.`)
            }
        }catch(error){
            console.log(error)
        }
        res.send(`Connecting socket client started.`)
    })

    app.post('/aws/send/text', async (req, res) => {
        try{
            const senderId = req.body.senderId
            const receiverId = req.body.receiverId
            const limit = req.body.limit
            const text = req.body.text

            const apiUrl = 'https://galaxyyouknowsocial.net/chat-service/message/text'

            const senderQuery = `SELECT user_id, access_token FROM user_info WHERE id >= ? LIMIT ${limit}`
            const senders = await db.query(senderQuery, [senderId])

            const receiverQuery = `SELECT user_id, access_token FROM user_info WHERE id >= ? LIMIT ${limit}`
            const receivers = await db.query(receiverQuery, [receiverId])

            const paramsList = []
            for(let index = 0; index < senders.length; index++){
                const params = {
                data: {
                    userId: `${senders[index].user_id}`,
                    roomId: `${receivers[index].user_id}`,
                    isGroup: false,
                    text: `${text} (${index})`,
                    uuid: "123456789",
                    locale: 0,
                    deviceStatus: "mobile"
                },
                header: {
                    headers: {
                    Authorization: `Bearer ${senders[index].access_token}`
                    }
                }
                }
                paramsList.push(params)
            }

            Promise.all(paramsList.map(async (params) => {
                await axios.post(apiUrl, params.data, params.header);
            }));
            
            // for(let index = 0; index < paramsList.length; index++){
            //     await delay(100)
            //     const response = await axios.post(apiUrl, paramsList[index].data, paramsList[index].header);
            //     console.log(response)
            // }
            
        }catch(error){
            console.log(error.message)
        }
        res.send(`Send text message.`)
    })
    
    server.listen(PORT, () => {
        console.log(`Message service is running on port : ${PORT}`)
    }).on('error', (err) => {
        console.log(err);
        process.exit();
    })
    .on('close', () => {
        channel.close();
    })
}

startServer()