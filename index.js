const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app)
const io = require('socket.io-client')
const db = require('./mysql-config')
const PORT = 3030
const cors = require('cors')
const bodyParser = require('body-parser')

const startServer = async() => {
    app.use(cors())
    app.use(bodyParser.json({limit: '2000mb'}))
    app.use(express.urlencoded({extended: true}));

    app.post('/aws/socket', async (req, res) => {
        try{
            const startId = req.body.startId
            const userLimit = req.body.userLimit
            
            const serverUrl = 'https://galaxyyouknowsocial.net'
            const inputQuery = `SELECT * FROM user_info WHERE id >= ? LIMIT ${userLimit}`
            const users = await db.query(inputQuery, [startId])

            if (users?.length){
                for(const user of users ){
                    const options = {
                        transports: ['websocket'],
                        extraHeaders: {
                        'token': `Bearer ${user.access_token}`,
                        'userid': `${user.user_id}`
                        }
                    }
                
                    const socket = io.connect(serverUrl, options)
                    
                    socket.on('CHAT_OPERATION_EVENT', (incommingMsg) => {
                        console.log('Received message: ', incommingMsg.data.message[0].messageInfo[0].mediaData.content.data.text)
                    });
                    
                    socket.on('disconnect', () => {
                        console.log('Server closed the connection')
                    });
                }
            }
        }catch(error){
            console.log(error)
        }
        res.send(`Connecting socket client started.`)
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