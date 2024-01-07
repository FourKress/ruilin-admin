import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { LoginForm, ProFormCheckbox, ProFormText } from '@ant-design/pro-components'

import Logo from '@/assets/images/react.svg'

import './style.scss'

const handleSubmit = () => {
  console.log('12')
}

function Login() {
  // const [count, setCount] = useState(0)

  return (
    <>
      <div className="login-container">
        <div className="content">
          <LoginForm
            logo={<img alt="logo" src={Logo} />}
            title="睿琳商城管理系统"
            initialValues={{
              autoLogin: true
            }}
            onFinish={async () => handleSubmit()}
          >
            <ProFormText
              name="username"
              fieldProps={{
                size: 'large',
                prefix: <UserOutlined className={'styles.prefixIcon'} />
              }}
              placeholder={'用户名: admin'}
              rules={[
                {
                  required: true,
                  message: '请输入用户名'
                }
              ]}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{
                size: 'large',
                prefix: <LockOutlined className={'styles.prefixIcon'} />
              }}
              placeholder={'密码: ant.design'}
              rules={[
                {
                  required: true,
                  message: '请输入密码！'
                }
              ]}
            />

            <div
              style={{
                marginBottom: 24
              }}
            >
              <ProFormCheckbox noStyle name="autoLogin">
                自动登录
              </ProFormCheckbox>
              <a
                style={{
                  float: 'right'
                }}
              >
                忘记密码
              </a>
            </div>
          </LoginForm>
        </div>
      </div>
    </>
  )
}

export default Login
