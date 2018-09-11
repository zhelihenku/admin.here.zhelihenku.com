import axios from 'axios'
import qs from 'qs'
import md5 from 'js-md5'
import { Message, MessageBox } from 'element-ui'
import store from '../store'
import { getLoginInfo, getRandomKey, getToken } from './auth'

let Base64 = require('js-base64').Base64;


var BASE_API = process.env.BASE_API

// 创建axios实例
const service = axios.create({
  baseURL: BASE_API, // api的base_url
  timeout: 5000 // 请求超时时间
})

// request拦截器
service.interceptors.request.use(
  config => {
    if (store.getters.token) {
      config.headers['Authorization'] = getToken() // 让每个请求携带自定义token 请根据实际情况自行修改
    }
    return config
  },
  error => {
    // Do something with request error
    console.log(error) // for debug
    Promise.reject(error)
  }
)

// respone拦截器
service.interceptors.response.use(
  response => {
    /**
     * code为非20000是抛错 可结合自己业务进行修改
     */
    const res = response.data
    if (res.code !== 0) {
      Message({
        message: res.message,
        type: 'error',
        duration: 5 * 1000
      })

      // 50008:非法的token; 50012:其他客户端登录了;  50014:Token 过期了;
      if (res.code === 50008 || res.code === 50012 || res.code === 50014 || res.code === 700) {
        MessageBox.confirm(
          '你已被登出，可以取消继续留在该页面，或者重新登录',
          '确定登出',
          {
            confirmButtonText: '重新登录',
            cancelButtonText: '取消',
            type: 'warning'
          }
        ).then(() => {
          store.dispatch('FedLogOut').then(() => {
            location.reload() // 为了重新实例化vue-router对象 避免bug
          })
        })
      }

      return response.data
    } else {
      return response.data
    }
  },
  error => {
    console.log('error is : ' + error) // for debug
    Message({
      message: error.message,
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

export default {

  get (url, params) {
    return service({
      method: 'get',
      url,
      params, // get 请求时带的参数
      timeout: 10000,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Authorization':localStorage.getItem("token")
      }
    }).then((response) => {
        return response;
      }
    )
  },
  post (url, data, isSecurity) {

    var params;
    var headers = {};

    if(isSecurity) {
      headers= {
        'Access-Control-Allow-Origin': '*',
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': getToken()
      }

      let randomKey = getRandomKey();

      let base = JSON.stringify(data);
      let base_64 = Base64.encode(base)
      let md_5 = md5(base_64+randomKey)
      var tempParams = {
        'object':base_64,
        'sign':md_5
      }

      params = JSON.stringify(tempParams)

      // params = JSON.stringify(data)
    } else {
      headers= {
        'Access-Control-Allow-Origin': '*',
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Authorization':getToken()
      }

      params = qs.stringify(data)
    }

    console.log('url is : ', url)
    console.log('headers is : ', headers)
    console.log('params is : ', params)


    return service({
      method: 'post',
      url,
      baseURL:"",
      data:params,
      timeout: 10000,
      headers: headers
    }).then((response) => {
      return response
    })

  },
  upload (url, data) {
    return service({
      method: 'post',
      url,
      data:data,
      timeout: 10000,
      headers : {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'multipart/form-data',
        'Authorization':localStorage.getItem("token")
      }
    }).then(
      (response) => {
        return response
      }
    )
  }
}

