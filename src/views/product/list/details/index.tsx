import { FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  FooterToolbar,
  PageContainer,
  ProForm,
  ProFormText,
  ProFormTextArea
} from '@ant-design/pro-components'
import { Button, Card, Col, message, Modal, Row } from 'antd'

import axios from '@/utils/axios.ts'
import Banner from '@/views/product/list/details/banner.tsx'
import Color from '@/views/product/list/details/color.tsx'
import Unit from '@/views/product/list/details/unit.tsx'

import './style.scss'

const { confirm } = Modal

const SeriesDetails: FC<Record<string, any>> = () => {
  const { id: productId } = useParams()
  const navigate = useNavigate()

  return (
    <PageContainer breadcrumbRender={false}>
      <ProForm
        className={'series-details'}
        layout="vertical"
        submitter={{
          render: (props: any, _dom: any) => {
            const details = props.form.getFieldValue() || {}
            return (
              <FooterToolbar>
                <Button
                  type="primary"
                  danger
                  onClick={() => {
                    confirm({
                      title: '确认操作',
                      content: '确认删除该商品吗?',
                      onOk() {
                        axios.get(`/product/delete/${productId}`).then(async () => {
                          message.success('删除商品成功')
                          navigate(-1)
                        })
                      }
                    })
                  }}
                >
                  删除
                </Button>
                <Button
                  type="primary"
                  onClick={async () => {
                    const res: any = await axios.get(`/product/details/${productId}`)
                    if (!res.name || !res.desc || !res.isComplete) {
                      confirm({
                        title: '确认操作',
                        content: '请先完善相关信息后再上架',
                        onOk() {}
                      })
                      return
                    } else {
                      const tips = res.isActive
                        ? '此操作将导致该商品下所有的SKU下架，确认下架该商品吗?'
                        : '确认上架该商品吗?'

                      confirm({
                        title: '确认操作',
                        content: tips,
                        onOk() {
                          axios
                            .post(`/product/active`, {
                              id: productId,
                              isActive: !res.isActive
                            })
                            .then(async () => {
                              message.success('商品状态修改成功')
                            })
                        }
                      })
                    }
                  }}
                >
                  {details.isActive ? '下架' : '上架'}
                </Button>
                <Button
                  type="primary"
                  onClick={async () => {
                    const { name, desc } = props.form.getFieldValue()
                    await axios.post(`/product/update`, {
                      name,
                      desc,
                      id: productId
                    })
                  }}
                >
                  保存
                </Button>
              </FooterToolbar>
            )
          }
        }}
        request={async () => {
          return await axios.get(`/product/details/${productId}`)
        }}
      >
        <>
          <Card title="基础信息" className={'card'} bordered={false}>
            <Row gutter={24}>
              <Col md={8}>
                <ProFormText
                  label={'商品名称'}
                  name="name"
                  rules={[{ required: true, message: '请输入商品名称' }]}
                  placeholder="请输入商品名称"
                />
              </Col>
              <Col md={8}>
                <ProFormText
                  label={'商品编码'}
                  name="code"
                  rules={[{ required: true, message: '请输入商品编码' }]}
                  placeholder="请输入商品编码"
                />
              </Col>
              <Col md={8}>
                <ProFormTextArea
                  label={'商品介绍'}
                  name="desc"
                  rules={[{ required: true, message: '请输入商品介绍' }]}
                  placeholder="请输入商品介绍"
                />
              </Col>
            </Row>
          </Card>

          <Card title="商品详情" className={'card'} bordered={false}>
            <Banner productId={productId} />
          </Card>

          <Card title="颜色管理" className={'card'} bordered={false}>
            <Color productId={productId} />
          </Card>

          <Card title="规格管理" className={'card'} bordered={false}>
            <Unit productId={productId} />
          </Card>
        </>
      </ProForm>
    </PageContainer>
  )
}

export default SeriesDetails