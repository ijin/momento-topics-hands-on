import React, { useState, useEffect } from 'react';
import AWS from 'aws-sdk';
import Chat from './Chat';

type MessageType = {
    name: string;
    profilePic: string;
    message: string;
    timestamp: string;
    }[]

function Chats() {
    const [chats, setChats] = useState<MessageType>([]);

    AWS.config.update({
        accessKeyId: process.env.NEXT_PUBLIC_ACCESS_KEY,
        secretAccessKey: process.env.NEXT_PUBLIC_SECRET_ACCESS_KEY,
        region: 'ap-northeast-1'
    });

    const dynamodb = new AWS.DynamoDB.DocumentClient();
    const s3 = new AWS.S3();
    const backetName = process.env.NEXT_PUBLIC_S3_BACKET_NAME;

    useEffect(() => {
        const fetchData = async () => {
            const params = {
                TableName: "UserData"
            };

            try {
                const result = await dynamodb.scan(params).promise();
                const userNames = result.Items?.map(item => item.username);
                const fetchedChats = [];

                for (let username of userNames as any) {
                    const s3Params = {
                        Bucket: `${backetName}`,
                        Prefix: username
                    };
                    const s3Data = await s3.listObjectsV2(s3Params).promise();
                    if (s3Data && s3Data.Contents && s3Data.Contents.length > 0) {
                        const imageUrl = `https://${backetName}.s3.ap-northeast-1.amazonaws.com/${s3Data.Contents[0].Key}`;
                        fetchedChats.push({
                            name: username,
                            profilePic: imageUrl,
                            message: "Hello!",
                            timestamp: "Just now"
                        });
                    }
                }

                setChats(fetchedChats);
            } catch (error) {
                console.error("Error fetching chats:", error);
            }
        };

        fetchData();
    }, []);

    return (
        <div className='chats'>
            {chats.map(chat => (
                <Chat
                    key={chat.name}
                    name={chat.name}
                    message={chat.message}
                    timestamp={chat.timestamp}
                    profilePic={chat.profilePic}
                />
            ))}
        </div>
    );
}

export default Chats;