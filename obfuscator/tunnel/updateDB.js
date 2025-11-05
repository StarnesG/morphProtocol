"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateServerInfo = exports.subClientNum = exports.addClientNum = exports.subTraffic = void 0;
const axios_1 = __importDefault(require("axios"));
const subTrafficUrl = process.env.SUB_TRAFFIC_URL;
const subTraffic = (userId, traffic) => __awaiter(void 0, void 0, void 0, function* () {
    if (userId && traffic) {
        yield (0, axios_1.default)({
            method: 'post',
            url: subTrafficUrl,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': '4EQQGDYZSDIYTCF4WJQFLXGBCNW6EAX6FVXA'
            },
            data: {
                id: userId,
                traffic: traffic
            }
        })
            .then(function (response) {
            // You can now work with the JSON response data directly
            console.log(response.data);
        })
            .catch(function (error) {
            console.error('axios error：', error);
        });
    }
});
exports.subTraffic = subTraffic;
const addClientNumUrl = process.env.ADD_CLIENTNUM_URL;
const addClientNum = (name) => __awaiter(void 0, void 0, void 0, function* () {
    if (name) {
        yield (0, axios_1.default)({
            method: 'post',
            url: addClientNumUrl,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': '4EQQGDYZSDIYTCF4WJQFLXGBCNW6EAX6FVXA'
            },
            data: {
                name: name
            }
        })
            .then(function (response) {
            // You can now work with the JSON response data directly
            console.log(response.data);
        })
            .catch(function (error) {
            console.error('axios error：', error);
        });
    }
});
exports.addClientNum = addClientNum;
const subClientNumUrl = process.env.SUB_CLIENTNUM_URL;
const subClientNum = (name) => __awaiter(void 0, void 0, void 0, function* () {
    if (name) {
        yield (0, axios_1.default)({
            method: 'post',
            url: subClientNumUrl,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': '4EQQGDYZSDIYTCF4WJQFLXGBCNW6EAX6FVXA'
            },
            data: {
                name: name
            }
        })
            .then(function (response) {
            // You can now work with the JSON response data directly
            console.log(response.data);
        })
            .catch(function (error) {
            console.error('axios error：', error);
        });
    }
});
exports.subClientNum = subClientNum;
const updateServerInfoUrl = process.env.UPDATE_SERVERINFO_URL;
const updateServerInfo = (name, ip, udpPort, tcpPort, info) => __awaiter(void 0, void 0, void 0, function* () {
    if (name && ip && info) {
        yield (0, axios_1.default)({
            method: 'post',
            url: updateServerInfoUrl,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': '4EQQGDYZSDIYTCF4WJQFLXGBCNW6EAX6FVXA'
            },
            data: {
                name: name,
                ip: ip,
                udpPort: udpPort.toString(),
                tcpPort: tcpPort.toString(),
                info: info,
                status: 'running'
            }
        })
            .then(function (response) {
            // You can now work with the JSON response data directly
            console.log(response.data);
        })
            .catch(function (error) {
            console.error('axios error：', error);
        });
    }
    else {
        console.log('updateServerInfo error, parameter invalid');
    }
});
exports.updateServerInfo = updateServerInfo;
