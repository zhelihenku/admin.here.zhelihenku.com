import Cookies from 'js-cookie'

const LoginInfoKey = 'Admin-LoginInfoKey'

export function getLoginInfo() {
  return Cookies.get(LoginInfoKey)
}

export function setLoginInfo(loginInfo) {
  return Cookies.set(LoginInfoKey, loginInfo)
}

export function removeLoginInfo() {
  return Cookies.remove(LoginInfoKey)
}

const TOKEN = 'Admin_Token_Key'
const RANDOMKEY = 'Admin_RandomKey_Key'

export function getToken() {
  return Cookies.get(TOKEN)
}

export function setToken(token) {
  return Cookies.set(TOKEN, token)
}

export function removeToken() {
  return Cookies.remove(TOKEN)
}

export function getRandomKey() {
  return Cookies.get(RANDOMKEY)
}

export function setRandomKey(randomKey) {
  return Cookies.set(RANDOMKEY, randomKey)
}

export function removeRandomKey() {
  return Cookies.remove(RANDOMKEY)
}

