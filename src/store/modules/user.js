import { login, logout, getInfo } from '@/api/login'
import httpClient from '@/utils/httpClient'
import {
  getLoginInfo,
  removeLoginInfo,
  removeRandomKey,
  removeToken,
  setLoginInfo,
  setRandomKey,
  setToken
} from '../../utils/auth'

const user = {
  state: {
    userInfo: {
      name: '',
      avatar: '',
      menus: [],
    }
  },

  mutations: {
    SET_USERINFO: (state, userInfo) => {
      state.userInfo = userInfo
    }
  },

  actions: {
    // 登录
    Login({ commit }, params) {
      return new Promise((resolve, reject) => {
        console.log(params);
        httpClient.post("/api/systemUser/login", params, false).then(response => {
          console.log("postSystemUserLogin response is :", response);
          if (response.code == 0) {
            let data = response.data
            setToken(data.token)
            setRandomKey(data.randomKey);
            resolve()
          } else {
            resolve()
          }
        }).catch(() => {
          reject(error)
        })
      })
    },

    // 获取用户信息
    LoadUserInfo({ commit }) {
      return new Promise((resolve, reject) => {
        httpClient.post("/api/systemUser/info", {}, true).then(response => {
          console.log("postSystemUserInfo response is :", response);
          if (response.code == 0) {
            const data = response.data
            if (data.menus.length <= 0) { // 验证返回的roles是否是一个非空数组
              reject('getInfo: roles must be a non-null array !')
            }

            commit('SET_USERINFO', data)
            resolve(response)
          } else {
            resolve()
          }
        }).catch(() => {
          reject(error)
        })
      })
    },

    // 登出
    LogOut({ commit, state }) {
      return new Promise((resolve, reject) => {
        commit('SET_USERINFO', {})
        removeToken()
        removeRandomKey()
        resolve()
      })
    },

    // 前端 登出
    FedLogOut({ commit }) {
      return new Promise(resolve => {
        commit('SET_USERINFO', {})
        removeToken()
        removeRandomKey()
        resolve()
      })
    }
  }
}

export default user
