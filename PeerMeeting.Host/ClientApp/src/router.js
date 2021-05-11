import Vue from 'vue'
import Router from 'vue-router'
import Welcome from './views/Welcome.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Welcome
    },
    {
      path: '/:id',
      name: 'room',
      component: () => import(/* webpackChunkName: "room" */ './views/Room.vue')
    }
  ]
})
