import axios, { AxiosResponse } from 'axios';
import { getServerConfig } from '../config';
import { SubTrafficRequest, ClientNumRequest, UpdateServerInfoRequest } from './types';

const config = getServerConfig();
const subTrafficUrl = config.api.subTrafficUrl;

export const subTraffic = async (userId: string | undefined, traffic: number | undefined) => {
    if (userId && traffic) {
        await axios({
            method: 'post',
            url: subTrafficUrl,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': config.api.authToken
            },
            data: {
                id: userId,
                traffic: traffic
            }
        })
            .then(function (response: AxiosResponse) {
                // You can now work with the JSON response data directly
                console.log(response.data)
            })
            .catch(function (error: any) {
                console.error('axios error：', error);
            });
    }
}

const addClientNumUrl = config.api.addClientNumUrl;
export const addClientNum = async (name: string | undefined) => {
    if (name) {
        await axios({
            method: 'post',
            url: addClientNumUrl,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': config.api.authToken
            },
            data: {
                name: name
            }
        })
            .then(function (response: AxiosResponse) {
                // You can now work with the JSON response data directly
                console.log(response.data)
            })
            .catch(function (error: any) {
                console.error('axios error：', error);
            });
    }
}

const subClientNumUrl = config.api.subClientNumUrl;
export const subClientNum = async (name: string | undefined) => {
    if (name) {
        await axios({
            method: 'post',
            url: subClientNumUrl,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': config.api.authToken
            },
            data: {
                name: name
            }
        })
            .then(function (response: AxiosResponse) {
                // You can now work with the JSON response data directly
                console.log(response.data)
            })
            .catch(function (error: any) {
                console.error('axios error：', error);
            });
    }
}

const updateServerInfoUrl = config.api.updateServerInfoUrl;
export const updateServerInfo = async (name: string | undefined, ip: string | undefined, port: number, info: string | undefined) => {
    if (name && ip && info) {
        await axios({
            method: 'post',
            url: updateServerInfoUrl,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': config.api.authToken
            },
            data: {
                name: name,
                ip: ip,
                port: port.toString(),
                info: info,
                status: 'running'
            }
        })
            .then(function (response: AxiosResponse) {
                // You can now work with the JSON response data directly
                console.log(response.data)
            })
            .catch(function (error: any) {
                console.error('axios error：', error);
            });
    }
    else {
        console.log('updateServerInfo error, parameter invalid')
    }
}