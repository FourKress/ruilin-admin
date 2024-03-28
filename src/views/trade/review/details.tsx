import { FC, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import {
  FooterToolbar,
  PageContainer,
  ProForm,
  ProFormCascader,
  ProFormItem,
  ProFormRate,
  ProFormSwitch,
  ProFormText
} from '@ant-design/pro-components'
import { Button, Col, Empty, Form, Image, message, Modal, Row, Space, Upload } from 'antd'

import axios from '@/utils/axios.ts'
import { checkFileSize, uploadFile } from '@/utils/fileUtils.ts'

const { confirm } = Modal

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo

const ReviewDetails: FC<Record<string, any>> = () => {
  const navigate = useNavigate()
  const { reviewId } = useParams()

  const [loading, setLoading] = useState<boolean>(false)
  const [fileList, setFileList] = useState<any>([])
  const [reviewDetails, setReviewDetails] = useState<Record<string, any>>({})
  const [form] = Form.useForm()
  const [previewInfo, setPreviewInfo] = useState({
    visible: false,
    url: ''
  })

  const [options, setOptions] = useState<any[]>([])
  const getProductList = () => {
    axios
      .post('/product/page', {
        size: 10000,
        current: 1
      })
      .then((res: any) => {
        const { records } = res
        console.log(records)
        setOptions(
          records.map((d: any) => {
            return {
              ...d,
              isLeaf: false
            }
          })
        )
      })
  }

  const getColorList = async (productId: string): Promise<any[]> => {
    return await axios.get(`/product-color/list/${productId}`)
  }

  useEffect(() => {
    getProductList()
  }, [])

  const loadData = async (selectedOptions: any[]) => {
    const targetOption = selectedOptions[selectedOptions.length - 1]
    const { id } = targetOption

    const colorList = await getColorList(id)
    targetOption.children = colorList.map((d: any) => {
      return {
        ...d,
        isLeaf: true
      }
    })

    setOptions([...options])
  }

  return (
    <PageContainer
      breadcrumbRender={false}
      header={{
        title: '评价详情',
        extra: [
          <Button
            key={'back'}
            type="primary"
            onClick={() => {
              navigate(`/trade/review`)
            }}
          >
            返回
          </Button>
        ]
      }}
    >
      <Row>
        <Col span={24}>
          <ProForm
            form={form}
            layout={'horizontal'}
            request={async () => {
              if (reviewId) {
                const res: any = await axios.get(`/review/details/${reviewId}`)
                setReviewDetails(res)

                let newFileList: any = []
                if (res?.objectKeys) {
                  newFileList = res?.imageList.map((url: string) => {
                    return {
                      status: 'done',
                      url
                    }
                  })

                  setFileList(newFileList)
                }
                form.setFieldsValue({
                  ...res,
                  fileInfo: { fileList: newFileList }
                })

                return {
                  ...res,
                  score: res.score || 5
                }
              }
              return {
                isActive: true,
                score: 5,
                isTop: false,
                fileInfo: { fileList: [] }
              }
            }}
            onFinish={async (data) => {
              setLoading(true)
              const {
                fileInfo: { fileList = [] },
                ids,
                ...other
              } = data
              let objectKeys = []
              if (fileList?.length) {
                objectKeys = await Promise.all(
                  fileList.map(async (file: any) => {
                    const { uid, type } = file
                    const objectKey = `${uid}.${type.replace(/[\w\W]+\//, '')}`
                    await uploadFile(file.originFileObj, objectKey)
                    return objectKey
                  })
                )
              }

              await axios
                .post(`/review/create`, {
                  ...other,
                  objectKeys: objectKeys,
                  productId: ids[0],
                  colorId: ids[1]
                })
                .finally(() => {
                  setLoading(false)
                })

              message.success(`评价新建成功`)

              navigate(`/trade/review`)

              return true
            }}
            submitter={
              perms.includes('edit-question')
                ? {
                    render: (props: any, _dom: any) => {
                      return (
                        <FooterToolbar
                          extra={
                            <Space size={'middle'}>
                              <Button
                                type="primary"
                                danger
                                onClick={() => {
                                  confirm({
                                    title: '确认操作',
                                    content: '确认删除该评价吗?',
                                    onOk: async () => {
                                      await axios.get(`/review/delete/${reviewId}`)
                                      message.success('评价删除成功')
                                      navigate('/trade/review')
                                    }
                                  })
                                }}
                              >
                                删除
                              </Button>
                            </Space>
                          }
                        >
                          {!reviewId && (
                            <Button
                              type="primary"
                              loading={loading}
                              onClick={async () => {
                                props.form?.submit?.()
                              }}
                            >
                              保存
                            </Button>
                          )}
                        </FooterToolbar>
                      )
                    }
                  }
                : false
            }
          >
            <ProFormText
              width={500}
              name="content"
              label="评价内容"
              disabled={!!reviewId}
              rules={[
                {
                  required: true,
                  message: '请输入评价内容'
                }
              ]}
            />
            <ProFormItem name="fileInfo" label={<span>&nbsp;&nbsp;&nbsp;评价图片</span>}>
              {fileList.length || !reviewId ? (
                <Upload
                  accept={'.png,.jpg,.jpeg'}
                  listType="picture-card"
                  fileList={fileList}
                  maxCount={9}
                  onChange={async ({ file, fileList: newFileList }) => {
                    if (newFileList.length && !checkFileSize(file)) {
                      return
                    }
                    form.setFieldValue('fileInfo', { fileList: [...newFileList] })
                    setFileList(newFileList)
                    await form.validateFields()
                  }}
                  onRemove={(file: any) => {
                    setFileList(fileList.filter((d: any) => file.uid !== d.uid))
                  }}
                  beforeUpload={() => false}
                  itemRender={(originNode, file) => {
                    return (
                      <div className={originNode.props.className}>
                        {originNode.props.children[0]}
                        <div className={originNode.props.children[2].props.className}>
                          <EyeOutlined
                            onClick={() => {
                              const url = file.url || file.thumbUrl
                              if (!url) return
                              setPreviewInfo({
                                visible: true,
                                url
                              })
                            }}
                          />
                          {!reviewId && originNode.props.children[2].props.children[2]}
                        </div>
                      </div>
                    )
                  }}
                >
                  {fileList.length >= 9 || reviewId ? null : (
                    <button style={{ border: 0, background: 'none' }} type="button">
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>上传</div>
                    </button>
                  )}
                </Upload>
              ) : (
                <Empty
                  style={{ margin: ' 4px 0 0', width: ' 52px', height: '52px' }}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </ProFormItem>
            <ProFormCascader
              width={500}
              fieldProps={{
                loadData: loadData,
                options: options,
                fieldNames: {
                  label: 'name',
                  value: 'id',
                  children: 'children'
                }
              }}
              name="ids"
              disabled={!!reviewId}
              label={<span>所属商品</span>}
              rules={[
                {
                  required: true,
                  message: '请选择所属商品'
                }
              ]}
            />
            <ProFormText
              width={500}
              name="orderNo"
              disabled
              placeholder={reviewId ? '' : '请输入'}
              fieldProps={{
                addonAfter: reviewDetails.orderId ? (
                  <span
                    style={{ color: 'rgb(22, 119, 255)', cursor: 'pointer' }}
                    onClick={() => {
                      navigate(`/trade/order/details/${reviewDetails.orderId}`)
                    }}
                  >
                    查看订单
                  </span>
                ) : null
              }}
              label={<span>&nbsp;&nbsp;&nbsp;所属订单</span>}
            />
            <ProFormText
              name="nickname"
              label="客户昵称"
              width={500}
              disabled={!!reviewId}
              fieldProps={{
                addonAfter: reviewDetails.customerId ? (
                  <span
                    style={{ color: 'rgb(22, 119, 255)', cursor: 'pointer' }}
                    onClick={() => {
                      navigate(`/trade/customer/details/${reviewDetails.customerId}`)
                    }}
                  >
                    查看客户
                  </span>
                ) : null
              }}
              rules={[
                {
                  required: true,
                  message: '请输入客户昵称'
                }
              ]}
            />
            <ProFormRate
              name="score"
              label="评价星级"
              disabled={!!reviewId}
              fieldProps={{
                allowClear: false,
                allowHalf: false,
                style: {
                  color: 'red'
                }
              }}
              rules={[
                {
                  required: true,
                  message: ''
                }
              ]}
            />
            <ProFormSwitch
              name="isTop"
              label="是否推荐"
              disabled={!!reviewId}
              rules={[
                {
                  required: true,
                  message: '123'
                }
              ]}
            />
            <ProFormSwitch
              name="isActive"
              label="评价状态"
              disabled={!!reviewId}
              rules={[
                {
                  required: true,
                  message: ''
                }
              ]}
            />
          </ProForm>

          <Image
            width={200}
            style={{ display: 'none' }}
            preview={{
              visible: previewInfo.visible,
              src: previewInfo.url,
              onVisibleChange: (value) => {
                setPreviewInfo({
                  visible: value,
                  url: ''
                })
              },
              toolbarRender: () => <span></span>
            }}
          />
        </Col>
      </Row>
    </PageContainer>
  )
}

export default ReviewDetails
