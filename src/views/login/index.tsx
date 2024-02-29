import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LockOutlined, PhoneOutlined } from '@ant-design/icons'
import { LoginForm, ModalForm, ProFormText } from '@ant-design/pro-components'
import { ConfigProvider, Form, message, theme } from 'antd'
import md5 from 'md5'

import Logo from '@/assets/images/Logo.png'
import axios from '@/utils/axios.ts'

import './style.scss'

interface ILoginForm {
  username: number
  password: string
}

function Login() {
  const [form] = Form.useForm<{ firstPassword: string; secondPassword: string }>()
  const [openModal, setOpenModal] = useState(false)
  const [userId, setUserId] = useState('')
  const [phoneNum, setPhoneNum] = useState<number>(0)
  const navigate = useNavigate()

  const handleLogin = (data: ILoginForm) => {
    const { password, username } = data
    setPhoneNum(username)

    axios
      .post('/auth/login', {
        username,
        password: md5(password).substring(8, 26)
      })
      .then((res: any) => {
        const { token, ...other } = res
        localStorage.setItem('token', token)
        localStorage.setItem('userInfo', JSON.stringify(other))
        navigate('/')
        location.reload()
      })
      .catch((err) => {
        const { code, data }: { code: number; data: { userId: string } } = err
        if (code === 11000) {
          setUserId(data.userId)
          setOpenModal(true)
        }
      })
  }

  const handleModifyPwd = (value: string) => {
    axios
      .post('/user/modifyPwd', {
        id: userId,
        password: md5(value).substring(8, 26)
      })
      .then(async () => {
        message.success('修改成功')
        handleLogin({
          username: phoneNum,
          password: value
        })
        setOpenModal(false)
      })
  }

  return (
    <ConfigProvider theme={{ algorithm: [theme.compactAlgorithm] }}>
      <div className="login-container">
        <div className="content">
          <LoginForm
            logo={<img alt="logo" src={Logo} />}
            title="睿琳商城系统"
            initialValues={{
              autoLogin: true
            }}
            onFinish={async (data: ILoginForm) => handleLogin(data)}
          >
            <ProFormText
              name="username"
              fieldProps={{
                size: 'large',
                prefix: <PhoneOutlined />,
                maxLength: 11
              }}
              placeholder={'请输入手机号'}
              rules={[
                {
                  required: true,
                  message: '请输入手机号'
                },
                () => ({
                  validator(_, value) {
                    const reg = /^1[3-9]\d{9}$/
                    if (value && !reg.test(value)) {
                      return Promise.reject(new Error('请输入11位的手机号'))
                    }
                    return Promise.resolve()
                  }
                })
              ]}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{
                size: 'large',
                prefix: <LockOutlined />
              }}
              placeholder={'请输入密码'}
              rules={[
                {
                  required: true,
                  message: '请输入密码'
                },
                () => ({
                  validator(_, value) {
                    if (value && (value.length < 6 || value.length > 10)) {
                      return Promise.reject(new Error('请输入6-10位密码'))
                    }
                    return Promise.resolve()
                  }
                })
              ]}
            />
          </LoginForm>

          <ModalForm<{
            firstPassword: string
            secondPassword: string
          }>
            open={openModal}
            title="修改密码"
            form={form}
            autoFocusFirstInput
            width={500}
            modalProps={{
              destroyOnClose: true,
              onCancel: () => setOpenModal(false)
            }}
            onFinish={async (values) => {
              handleModifyPwd(values.firstPassword)
            }}
          >
            <ProFormText.Password
              name="firstPassword"
              label="新密码"
              placeholder={'请输入6-10位的新密码'}
              rules={[
                {
                  required: true
                },
                () => ({
                  validator(_, value) {
                    if (value && (value.length < 6 || value.length > 10)) {
                      return Promise.reject(new Error('请输入6-10位的新密码'))
                    }
                    return Promise.resolve()
                  }
                })
              ]}
            />
            <ProFormText.Password
              name="secondPassword"
              label="确认密码"
              placeholder={'请输入确认密码'}
              dependencies={['firstPassword']}
              rules={[
                {
                  required: true
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('firstPassword') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('两次密码输入不匹配'))
                  }
                })
              ]}
            />
          </ModalForm>
        </div>
      </div>
    </ConfigProvider>
  )
}

export default Login
