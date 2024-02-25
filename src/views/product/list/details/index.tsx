import { FC, useState } from 'react'
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
import Sku from '@/views/product/list/details/sku.tsx'
import Unit from '@/views/product/list/details/unit.tsx'

import './style.scss'

const { confirm } = Modal

const SeriesDetails: FC<Record<string, any>> = () => {
  const { id: productId } = useParams()
  const navigate = useNavigate()
  const [colorList, setColorList] = useState<any[]>([])
  const [unitList, setUnitList] = useState<any[]>([])
  const [bannerInfo, setBannerInfo] = useState<Record<string, any>>([])
  const [summaryList, setSummaryList] = useState<any[]>([])

  console.log('bannerInfo', bannerInfo)
  console.log('summaryList', summaryList)

  return (
    <PageContainer breadcrumbRender={false}>
      <ProForm
        className={'series-details'}
        layout="horizontal"
        submitter={{
          render: (props: any, _dom: any) => {
            return (
              <FooterToolbar
                extra={
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
                }
              >
                <Button
                  type="primary"
                  onClick={async () => {
                    props.form?.submit?.()
                  }}
                >
                  保存
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
                    } else if (!res.isActive) {
                      confirm({
                        title: '确认操作',
                        content: '确认上架该商品吗?',
                        onOk() {
                          axios
                            .post(`/product/active`, {
                              id: productId,
                              isActive: !res.isActive
                            })
                            .then(async () => {
                              message.success('商品上架成功')
                            })
                        }
                      })
                    }
                  }}
                >
                  保存并上架
                </Button>
              </FooterToolbar>
            )
          }
        }}
        onFinish={async (values) => {
          console.log(values)
          // const { name, desc } = props.form.getFieldValue()
          // await axios.post(`/product/update`, {
          //   name,
          //   desc,
          //   id: productId
          // })
          message.success('提交成功')
          return true
        }}
        request={async () => {
          return await axios.get(`/product/details/${productId}`)
        }}
      >
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
                fieldProps={{
                  autoSize: {
                    minRows: 1
                  }
                }}
                label={'商品介绍'}
                name="desc"
                rules={[{ required: true, message: '请输入商品介绍' }]}
                placeholder="请输入商品介绍"
              />
            </Col>
          </Row>
        </Card>
      </ProForm>

      <Card title="商品详情" className={'card'} bordered={false} style={{ marginBottom: '24px' }}>
        <Banner
          productId={productId}
          onBannerUpdate={(data) => {
            setBannerInfo(data)
          }}
          onSummaryUpdate={(data) => {
            setSummaryList(data)
          }}
        />
      </Card>

      <Card title="商品颜色" className={'card'} bordered={false} style={{ marginBottom: '24px' }}>
        <Color
          productId={productId}
          onUpdate={(data) => {
            setColorList(data)
          }}
        />
      </Card>

      <Card title="规格管理" className={'card'} bordered={false} style={{ marginBottom: '24px' }}>
        <Unit
          productId={productId}
          onUpdate={(data) => {
            setUnitList(data)
          }}
        />
      </Card>

      <Card title="SKU管理" className={'card'} bordered={false}>
        <Sku productId={productId} colorList={colorList} unitList={unitList} />
      </Card>
    </PageContainer>
  )
}

export default SeriesDetails
