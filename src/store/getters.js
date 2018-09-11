const getters = {
  sidebar: state => state.app.sidebar,
  device: state => state.app.device,

  loginInfo: state => state.user.loginInfo,
  userInfo: state => state.user.userInfo,

  permission_routers: state => state.permission.routers,
  addRouters: state => state.permission.addRouters
}
export default getters
