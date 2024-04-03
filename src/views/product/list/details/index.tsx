import { FC, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import {
  FooterToolbar,
  PageContainer,
  ProForm,
  ProFormItem,
  ProFormText,
  ProFormTextArea
} from '@ant-design/pro-components'
import {
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Image,
  message,
  Modal,
  Row,
  Space,
  Spin,
  Upload
} from 'antd'

import axios from '@/utils/axios.ts'
import { checkFileSize, uploadFile } from '@/utils/fileUtils.ts'
import Banner from '@/views/product/list/details/banner.tsx'
import Color from '@/views/product/list/details/color.tsx'
import Sku from '@/views/product/list/details/sku.tsx'
import Unit from '@/views/product/list/details/unit.tsx'

import './style.scss'

const { confirm } = Modal

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo

let productId: string | undefined = ''

const ProductDetails: FC<Record<string, any>> = () => {
  const navigate = useNavigate()
  const { id, edit } = useParams()
  const isEdit = edit === '1'
  productId = id

  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [colorList, setColorList] = useState<any[]>([])
  const [unitList, setUnitList] = useState<any[]>([])

  const unitRef = useRef<any>()
  const detailsRef = useRef<any>()
  const colorRef = useRef<any>()
  const skuRef = useRef<any>()

  const [fileList, setFileList] = useState<any>([])
  const [form] = Form.useForm()
  const [previewInfo, setPreviewInfo] = useState({
    visible: false,
    url: ''
  })

  const handleFileUpdate = async (file: any) => {
    const { uid, type, name } = file
    const objectKey = `${uid}.${type.replace(/[\w\W]+\//, '')}`
    await uploadFile(file.originFileObj, objectKey).catch(async () => {
      message.error('文件上传失败')
    })
    return {
      productId: productId,
      fileName: name,
      fileType: type,
      uid,
      objectKey
    }
  }

  const handleColorFileUpdate = async (file: Record<string, any>, type: string) => {
    if (file.status) {
      return {
        ...file,
        productId: productId,
        type
      }
    }

    const result = await handleFileUpdate(file)
    return {
      ...result,
      productId: productId,
      type
    }
  }

  const handleBannerEdit = async (
    imageFileList: any[],
    videoFileList: any[],
    removeIds: string[]
  ) => {
    const imageList: Record<string, any> = []
    const videoList: Record<string, any> = []
    await Promise.all(
      [...imageFileList, ...videoFileList].map(async (d: any) => {
        const { type } = d
        const result = await handleFileUpdate(d)
        if (type.includes('video')) {
          videoList.push(result)
        } else {
          imageList.push(result)
        }
      })
    )
    await axios.post(`/product-banner/edit`, {
      imageList,
      videoList,
      removeIds,
      productId: productId
    })
  }

  const handleSummaryEdit = async (summaryList: Record<string, any>[], removeIds: string[]) => {
    const editList = summaryList.map((d: Record<string, any>) => {
      if (d.createTime) {
        return d
      }
      const { name, desc } = d
      return {
        name,
        desc,
        productId: productId
      }
    })
    await axios.post(`/product-summary/edit`, {
      editList,
      removeIds,
      productId: productId
    })
  }

  const handleColorEdit = async (
    colorList: Record<string, any>[],
    removeIds: string[],
    fileRemoveIds: string[]
  ) => {
    const editList = await Promise.all(
      colorList.map(async (d: Record<string, any>) => {
        const { createTime, name, desc, smallFileList = [], fileList = [] } = d
        const editFileList = await Promise.all(
          fileList.map(async (file: Record<string, any>) => {
            return await handleColorFileUpdate(file, 'carousel')
          })
        )
        const editSmallFileList = await Promise.all(
          smallFileList.map(async (file: Record<string, any>) => {
            return await handleColorFileUpdate(file, 'header')
          })
        )
        if (createTime) {
          return {
            ...d,
            fileList: editFileList,
            smallFileList: editSmallFileList
          }
        }
        return {
          name,
          desc,
          fileList: editFileList,
          smallFileList: editSmallFileList,
          productId: productId
        }
      })
    )

    return await axios.post(`/product-color/edit`, {
      editList,
      removeIds,
      fileRemoveIds,
      productId: productId
    })
  }

  const handleUnitEdit = async (
    unitList: Record<string, any>[],
    removeIds: string[],
    tagRemoveIds: string[]
  ) => {
    const editList = unitList.map((d: Record<string, any>) => {
      const { createTime, name, tags = [] } = d
      const editTagList = tags.map((tag: Record<string, any>) => {
        return {
          ...tag,
          id: tag.createTime ? tag.id : undefined,
          productId: productId
        }
      })
      if (createTime) {
        return {
          ...d,
          tags: editTagList
        }
      }
      return {
        name,
        tags: editTagList,
        productId: productId
      }
    })
    return await axios.post(`/product-unit/edit`, {
      editList,
      removeIds,
      tagRemoveIds,
      productId: productId
    })
  }

  const handleUpdateProductInfo = async (values: any): Promise<any> => {
    const { fileInfo, ...other } = values
    const fileList = fileInfo?.fileList || []
    let objectKey
    if (fileList.length) {
      const file = fileList[0]
      if (file.status === 'done') {
        objectKey = file.objectKey
      } else {
        const result = await handleFileUpdate(file)
        objectKey = result.objectKey
      }
    }
    return await axios.post(`/product/${productId ? 'update' : 'create'}`, {
      ...other,
      id: productId || undefined,
      objectKey
    })
  }

  const handleFormSkuData = (colors: any[], units: [], skuEditList: []): any[] => {
    if (!colors.length) {
      return []
    }

    let dataList: any[] = []
    if (units.length) {
      colors.forEach((c: any) => {
        let currentList: any[] = []
        units.forEach((unit: any) => {
          const { tags } = unit

          const newTags = tags.map((tag: any) => {
            return {
              [`unit_${unit.id}`]: tag.id,
              colorId: c.id
            }
          })

          if (currentList.length) {
            const tempList = [...currentList]
            currentList = []
            tempList.forEach((t: Record<string, any>) => {
              const unitKeyList = Object.keys(t).filter((key) => key.includes('unit'))!
              newTags.forEach((n: any) => {
                currentList.push({
                  ...n,
                  ...Object.fromEntries(
                    unitKeyList.map((k) => {
                      return [k, t[k]]
                    })
                  )
                })
              })
            })
          } else {
            currentList.push(...newTags)
          }
        })
        dataList.push(...currentList)
      })
    } else {
      dataList = colors.map((d: any) => {
        return {
          colorId: d.id
        }
      })
    }

    return dataList.map((d, index) => {
      const { colorId } = d
      const sku: Record<string, any> = skuEditList[index]
      const { isActive, price, code, stock } = sku
      const unitKeyList = Object.keys(d).filter((key) => key.includes('unit'))!
      return {
        colorId,
        isActive,
        price,
        code,
        stock,
        unitIds: unitKeyList.map((k) => k.replace(/unit_/, '')),
        tagIds: unitKeyList.map((k) => d[k]),
        productId: productId,
        id: sku.createTime ? sku.id : undefined
      }
    })
  }

  const handleEditSku = async (editList: any[], isAddUnit: boolean) => {
    const colorInfo = colorRef.current?.getData()
    const unitInfo = unitRef.current?.getData()
    let colorRemoveIds = []
    let unitRemoveIds = []
    let tagRemoveIds = []
    if (colorInfo.removeIds?.length) {
      colorRemoveIds = colorInfo.removeIds
    }
    if (unitInfo.removeIds?.length) {
      unitRemoveIds = unitInfo.removeIds
    }
    if (unitInfo.tagRemoveIds?.length) {
      tagRemoveIds = unitInfo.tagRemoveIds
    }
    await axios.post(`/product-sku/edit`, {
      editList,
      colorRemoveIds,
      unitRemoveIds,
      tagRemoveIds,
      isAddUnit,
      productId: productId
    })
  }

  const handleCheckData = () => {
    const colorInfo = colorRef.current?.getData()
    const unitInfo = unitRef.current?.getData()
    const skuInfo = skuRef.current?.getData()

    if (!(colorInfo.editList.length && unitInfo.editList.length && skuInfo.editList.length)) {
      message.warning('请完善颜色、规格、SKU相关数据').then(() => {})
      return false
    }

    let isEmpty = false
    const hasColorEmptyData = colorInfo.editList.some(
      (d: any) => !d.name || !d.desc || !d.smallFileList.length
    )
    if (hasColorEmptyData) {
      message.warning('请完善颜色名称、颜色描述、头图的相关数据').then(() => {})
      isEmpty = true
    }
    const hasUnitEmptyData = unitInfo.editList.some((d: any) => !d.name || !d.tags.length)
    if (hasUnitEmptyData) {
      message.warning('请完善规格名称、规格属性的相关数据').then(() => {})
      isEmpty = true
    }
    const hasSkuEmptyData = skuInfo.editList.some((d: any) => d.isActive && (!d.stock || !d.price))
    if (hasSkuEmptyData) {
      message.warning('请完善SKU库存、SKU价格的相关数据').then(() => {})
      isEmpty = true
    }

    return !isEmpty
  }

  const handleSave = async (values: any, check = false) => {
    const bannerInfo = detailsRef.current?.getBannerData()
    const summaryInfo = detailsRef.current?.getSummaryData()
    const colorInfo = colorRef.current?.getData()
    const unitInfo = unitRef.current?.getData()
    const skuInfo = skuRef.current?.getData()
    console.log('bannerInfo', bannerInfo)
    console.log('summaryInfo', summaryInfo)
    console.log('colorInfo', colorInfo)
    console.log('unitInfo', unitInfo)
    console.log('skuInfo', skuInfo)

    if (check && !handleCheckData()) {
      return false
    }

    setLoading(true)

    try {
      if (!productId) {
        const res = await handleUpdateProductInfo(values)
        if (!res) {
          setLoading(false)
          return false
        }
        productId = res.id
      } else {
        await handleUpdateProductInfo(values)
      }

      if (bannerInfo) {
        const { image, video } = bannerInfo
        await handleBannerEdit(image.upload, video.upload, [...image.removeIds, ...video.removeIds])
      }

      if (summaryInfo) {
        const { editList, removeIds } = summaryInfo
        await handleSummaryEdit(editList, removeIds)
      }

      let colorData: any = []
      let unitData: any = []
      if (colorInfo) {
        const { editList, removeIds, fileRemoveIds } = colorInfo
        colorData = await handleColorEdit(editList, removeIds, fileRemoveIds)
      }
      if (unitInfo) {
        const { editList, removeIds, tagRemoveIds } = unitInfo
        unitData = await handleUnitEdit(editList, removeIds, tagRemoveIds)
      }

      if (colorData.length && unitData.length) {
        const { editList } = skuInfo
        const skuEditList: any[] = handleFormSkuData(colorData, unitData, editList)
        await handleEditSku(skuEditList, unitInfo.isAddUnit)
      }

      navigate(`/product/list/details/1/${productId}`)
      setRefreshKey(Date.now())
      message.success('保存成功')
      setLoading(false)

      return true
    } catch (e) {
      setLoading(false)

      return false
    }
  }

  const handleActive = () => {
    axios
      .post(`/product/active`, {
        id: productId,
        isActive: true
      })
      .then(() => {
        message.success('商品保存并上架成功').then(() => {})
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const uploadButton = isEdit && (
    <button style={{ border: 0, background: 'none' }} type="button">
      <PlusOutlined />
      <div>上传</div>
    </button>
  )

  return (
    <PageContainer
      breadcrumbRender={false}
      key={refreshKey}
      header={{
        title: '商品详情',
        extra: [
          <Button
            key={'back'}
            type="primary"
            onClick={() => {
              navigate(`/product/list`)
            }}
          >
            返回
          </Button>
        ]
      }}
    >
      <Spin
        size="large"
        tip={<div style={{ marginTop: '12px' }}>数据保存中</div>}
        fullscreen={true}
        spinning={loading}
      />
      <ProForm
        className={'product-details'}
        layout="horizontal"
        initialValues={{ name: '', desc: '', code: '', fileInfo: null }}
        form={form}
        submitter={
          isEdit
            ? {
                render: (props: any, _dom: any) => {
                  return (
                    <FooterToolbar
                      extra={
                        <Space size={'middle'}>
                          {perms.includes('delete-product') && (
                            <Button
                              type="primary"
                              danger
                              onClick={() => {
                                confirm({
                                  title: '确认操作',
                                  content: '确认删除该商品吗?',
                                  onOk: async () => {
                                    await axios.get(`/product/delete/${productId}`)
                                    message.success('商品删除成功')
                                    navigate('/product/list')
                                  }
                                })
                              }}
                            >
                              删除
                            </Button>
                          )}
                        </Space>
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
                          props.form
                            ?.validateFields?.()
                            .then(async (values: Record<string, any>) => {
                              confirm({
                                title: '确认操作',
                                content: '确认保存并上架该商品吗?',
                                onOk() {
                                  handleSave(values, true).then((saveStatus) => {
                                    if (!saveStatus) return
                                    setLoading(true)
                                    handleActive()
                                  })
                                }
                              })
                            })
                        }}
                      >
                        保存并上架
                      </Button>
                    </FooterToolbar>
                  )
                }
              }
            : false
        }
        onFinish={async (values) => {
          await handleSave(values)
          return true
        }}
        request={async () => {
          if (productId) {
            const res: any = await axios.get(`/product/details/${productId}`)
            const { code, name, desc, online_code, online_name, online_desc, objectKey, url } = res
            let newFileList: any[] = []
            if (objectKey) {
              newFileList = [
                {
                  status: 'done',
                  objectKey,
                  url
                }
              ]
              setFileList(newFileList)
            }
            if (isEdit)
              return {
                name,
                code,
                desc,
                fileInfo: { fileList: newFileList }
              }
            return {
              code: online_code,
              name: online_name,
              desc: online_desc,
              fileInfo: { fileList: newFileList }
            }
          }
          return {}
        }}
      >
        <Card title="基础信息" style={{ marginBottom: '24px' }} bordered={false}>
          <Row gutter={24}>
            <Col md={8}>
              <ProFormText
                fieldProps={{
                  readOnly: !isEdit
                }}
                label={'商品名称'}
                name="name"
                rules={[{ required: true, message: '请输入商品名称' }]}
                placeholder="请输入商品名称"
              />
            </Col>
            <Col md={8}>
              <ProFormTextArea
                fieldProps={{
                  readOnly: !isEdit,
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
            <Col md={8}>
              <ProFormText
                fieldProps={{
                  readOnly: !isEdit
                }}
                label={'商品编码'}
                name="code"
                placeholder="请输入商品编码"
              />
            </Col>
            <Col>
              <ProFormItem
                name="fileInfo"
                label="商品Banner"
                rules={[
                  {
                    required: true,
                    message: '请选择图片'
                  },
                  () => ({
                    validator(_, value) {
                      if (value && !value.fileList.length) {
                        return Promise.reject(new Error('请选择图片'))
                      }
                      return Promise.resolve()
                    }
                  })
                ]}
              >
                <Descriptions title="">
                  <Descriptions.Item
                    label="素材限制"
                    contentStyle={{ color: 'rgba(0, 0, 0, 0.45)' }}
                  >
                    图片宽高比例建议为1920:400。大小10M以内
                  </Descriptions.Item>
                </Descriptions>
                <Upload
                  className={'banner-upload'}
                  accept={'.png,.jpg,.jpeg'}
                  listType="picture-card"
                  fileList={fileList}
                  maxCount={1}
                  onChange={async ({ file, fileList: newFileList }) => {
                    if (newFileList.length && !checkFileSize(file)) {
                      return
                    }
                    form.setFieldValue('fileInfo', { fileList: [...newFileList] })
                    setFileList(newFileList)
                    await form.validateFields()
                  }}
                  onRemove={() => {
                    setFileList([])
                  }}
                  beforeUpload={() => false}
                  onPreview={(file) => {
                    const url = file.url || file.thumbUrl
                    if (!url) return
                    setPreviewInfo({
                      visible: true,
                      url
                    })
                  }}
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
                          {isEdit && originNode.props.children[2].props.children[2]}
                        </div>
                      </div>
                    )
                  }}
                >
                  {fileList.length >= 1 ? null : uploadButton}
                </Upload>
              </ProFormItem>
            </Col>
          </Row>
        </Card>
      </ProForm>
      <Card title="商品详情" bordered={false} style={{ marginBottom: '24px' }}>
        <Banner ref={detailsRef} />
      </Card>
      <Card title="商品颜色" bordered={false} style={{ marginBottom: '24px' }}>
        <Color
          ref={colorRef}
          onUpdate={(data) => {
            setColorList(data)
          }}
        />
      </Card>
      <Card title="规格管理" bordered={false} style={{ marginBottom: '24px' }}>
        <Unit
          ref={unitRef}
          onUpdate={(data) => {
            setUnitList(data)
          }}
        />
      </Card>
      <Card title="SKU管理" bordered={false}>
        <Sku ref={skuRef} colorList={colorList} unitList={unitList} />
      </Card>

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
    </PageContainer>
  )
}

export default ProductDetails
