import { FC, useState } from 'react'
import { FooterToolbar, PageContainer, ProForm, ProFormText } from '@ant-design/pro-components'
import { Button, Col, Form, message, Row } from 'antd'

import MyEditor from '@/components/MyEditor.tsx'
import axios from '@/utils/axios.ts'

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo

const About: FC<Record<string, any>> = () => {
  const [form] = Form.useForm()

  const [htmlContent, setHtmlContent] = useState<any>('')
  const [htmlText, setHtmlText] = useState<any>('')
  const [objectKeys, setObjectKeys] = useState<string[]>([])

  const [loading, setLoading] = useState<boolean>(false)

  return (
    <PageContainer
      breadcrumbRender={false}
      header={{
        title: '关于我们'
      }}
    >
      <Row>
        <Col span={24}>
          <ProForm
            form={form}
            layout={'horizontal'}
            request={async () => {
              const res: any = await axios.get(`/about/details`)
              if (!res?.id) return {}

              const { content, text, objectKeys } = res

              setHtmlContent(content)
              setHtmlText(text)
              setObjectKeys(objectKeys)

              form.setFieldsValue({
                ...res
              })

              return res
            }}
            onFinish={async (data) => {
              setLoading(true)
              const id = form.getFieldValue('id')

              await axios
                .post(`/about/${id ? 'update' : 'create'}`, {
                  id: id || undefined,
                  ...data,
                  text: htmlText,
                  objectKeys: objectKeys
                })
                .finally(() => {
                  setLoading(false)
                })

              message.success(`关于我们编辑成功`)
            }}
            submitter={
              perms.includes('edit-info')
                ? {
                    render: (props: any, _dom: any) => {
                      return (
                        <FooterToolbar>
                          <Button
                            type="primary"
                            loading={loading}
                            onClick={async () => {
                              props.form?.submit?.()
                            }}
                          >
                            保存
                          </Button>
                        </FooterToolbar>
                      )
                    }
                  }
                : false
            }
          >
            <ProFormText
              name="content"
              label="正文"
              rules={[
                {
                  required: true,
                  message: '请编辑正文'
                }
              ]}
            >
              <MyEditor
                content={htmlContent}
                onUpdate={(html, text, objectKeys) => {
                  const oldContent = form.getFieldValue('content')
                  form.setFieldValue('content', html)
                  setHtmlText(text)
                  setObjectKeys(objectKeys)
                  if (oldContent !== html) {
                    form.validateFields(['content'])
                  }
                }}
              />
            </ProFormText>
          </ProForm>
        </Col>
      </Row>
    </PageContainer>
  )
}

export default About
