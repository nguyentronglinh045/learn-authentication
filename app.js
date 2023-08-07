class Http {
  constructor() {
    this.instance = axios.create({
      baseURL: 'https://api-ecom.duthanhduoc.com/',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'expire-access-token': 5,
        'expire-refresh-token': 10 // 30days
      }
    })
    this.requestTokenRequest = null
    this.instance.interceptors.request.use(
      (config) => {
        console.log(config);
        const access_token = localStorage.getItem('access_token')
        console.log('access_token in instance', access_token);
        if (access_token) {
          config.headers.Authorization = access_token
        }
        return config
      },
      (error) => Promise.reject(error)
    )
    this.instance.interceptors.response.use(
      (config) => config.data,
      (error) => {
        if (
          error.response.status === 401 &&
          error.response.data.name === 'EXPIRED_TOKEN'
        ) {
          this.refreshTokenRequest = this.refreshTokenRequest
            ? this.refreshTokenRequest
            : refreshToken().finally(() => {
              this.refreshTokenRequest = null
            })
          return this.refreshTokenRequest
            .then((access_token) => {
              error.response.config.Authorization = access_token
              return this.instance(error.response.config)
            })
            .catch((refreshTokenerror) => {
              throw refreshTokenerror
            })
        }
        return Promise.reject(error)
      }
    )
  }
  get(url) {
    return this.instance.get(url)
  }
  post(url, body) {
    return this.instance.post(url, body)
  }
}

const http = new Http()

const refreshToken = async () => {
  const refresh_token = localStorage.getItem('refresh_token')
  try {
    const res = await http.post('refresh-access-token', {
      refresh_token
    })
    const { access_token } = res.data
    localStorage.setItem('access_token', access_token)
    return access_token
  } catch (error) {
    console.log('adasd');
    localStorage.clear()
    throw error.response
  }
}

const fetchProfile = () => {
  console.log('set accesstoken', localStorage.getItem('access_token'));
  http
    .get('me')
    .then((res) => {
      console.log(res)
    })
    .catch((error) => {
      console.log(error)
    })
}
const fetchProducts = () => {
  http
    .get('purchases?status=-1')
    .then((response) => {
      console.log(response)
    })
    .catch((error) => {
      console.log(error)
    })
}

document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault()
  const userName = document.getElementById('user-name').value
  const password = document.getElementById('password').value
  http
    .post('login', {
      "email": userName,
      password,
    })
    .then((response) => {
      localStorage.setItem('access_token', response.data.access_token)
      localStorage.setItem('refresh_token', response.data.refresh_token)
      console.log('set accesstoken in login', localStorage.getItem('access_token'));
    })
    .catch((error) => {
      console.log(error)
    })
})

document.getElementById('btn-get-profile').addEventListener('click', (e) => {
  fetchProfile()
})
document.getElementById('btn-get-products').addEventListener('click', (e) => {
  fetchProducts()
})
document.getElementById('btn-get-both').addEventListener('click', (e) => {
  fetchProfile()
  fetchProducts()
})

document.getElementById('btn-refresh-token').addEventListener('click', (e) => {
  refreshToken()
})
