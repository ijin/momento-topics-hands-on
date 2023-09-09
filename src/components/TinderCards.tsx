import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic';
import AWS from 'aws-sdk';
const TinderCard = dynamic(() => import('react-tinder-card'), {
  ssr: false
});

type FetchedPeople = {
    name: any;
    url: string;
}[]

function TinderCards() {
    const [people, setPeople] = useState<FetchedPeople>([]);

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

                const fetchedPeople = [];

                for (let username of userNames as any) {
                    const s3Params = {
                        Bucket: `${backetName}`,
                        Prefix: username // assuming it would match the [key] in S3
                    };
                    const s3Data = await s3.listObjectsV2(s3Params).promise();
                    if (s3Data && s3Data.Contents && s3Data.Contents.length > 0) {
                        const imageUrl = `https://${backetName}.s3.ap-northeast-1.amazonaws.com/${s3Data.Contents[0].Key}`;
                        fetchedPeople.push({
                            name: username,
                            url: imageUrl
                        });
                    }
                }
                setPeople(fetchedPeople);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    return (
        <div>
            <div className='flex justify-center mt-20'>
                {people.map(person => (
                    <TinderCard className='absolute bg-white' key={person.name} preventSwipe={['up', 'down']}>
                        <div style={{ backgroundImage: `url(${person.url})` }} className='relative w-[600px] p-5 max-w-[85vw] h-[50vh] rounded-xl bg-cover bg-center shadow-lg'>
                        </div>
                        <h3 className='bottom-2.5 text-black bg-white rounded-xl text-center'>{person.name}</h3>
                    </TinderCard>
                ))}
            </div>
        </div>
    )
}

export default TinderCards
