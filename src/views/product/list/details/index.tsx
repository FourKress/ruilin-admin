import { FC, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  FooterToolbar,
  PageContainer,
  ProForm,
  ProFormText,
  ProFormTextArea
} from '@ant-design/pro-components'
import { Button, Card, Col, message, Modal, Row, Spin } from 'antd'

import axios from '@/utils/axios.ts'
import { uploadFile } from '@/utils/fileUtils.ts'
import Banner from '@/views/product/list/details/banner.tsx'
import Color from '@/views/product/list/details/color.tsx'
import Sku from '@/views/product/list/details/sku.tsx'
import Unit from '@/views/product/list/details/unit.tsx'

import './style.scss'

const { confirm } = Modal

const ProductDetails: FC<Record<string, any>> = () => {
  const { id: productId } = useParams()
  const navigate = useNavigate()
  const {
    state: { isEdit }
  } = useLocation()

  const [loading, setLoading] = useState(false)
  const [colorList, setColorList] = useState<any[]>([])
  const [unitList, setUnitList] = useState<any[]>([])

  const unitRef = useRef<any>()
  const detailsRef = useRef<any>()
  const colorRef = useRef<any>()
  const skuRef = useRef<any>()

  const handleFileUpdate = (file: any) => {
    const { uid, type, name } = file
    const objectKey = `${uid}.${type.replace(/[\w\W]+\//, '')}`
    uploadFile(file.originFileObj, objectKey).catch(async () => {
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

  const handleColorFileUpdate = (file: Record<string, any>, type: string) => {
    if (file.status) {
      return {
        ...file,
        productId: productId,
        type
      }
    }

    const result = handleFileUpdate(file)
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
        const result = handleFileUpdate(d)
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
      removeIds
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
      removeIds
    })
  }

  const handleColorEdit = async (
    colorList: Record<string, any>[],
    removeIds: string[],
    fileRemoveIds: string[]
  ) => {
    const editList = colorList.map((d: Record<string, any>) => {
      const { createTime, name, desc, smallFileList = [], fileList = [] } = d
      const editFileList = fileList.map((file: Record<string, any>) => {
        return handleColorFileUpdate(file, 'carousel')
      })
      const editSmallFileList = smallFileList.map((file: Record<string, any>) => {
        return handleColorFileUpdate(file, 'header')
      })
      if (createTime) {
        return {
          ...d,
          fileList: [...editFileList, ...editSmallFileList],
          smallFileList: undefined
        }
      }
      return {
        name,
        desc,
        fileList: [...editFileList, ...editSmallFileList],
        productId: productId
      }
    })

    return await axios.post(`/product-color/edit`, {
      editList,
      removeIds,
      fileRemoveIds
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
      tagRemoveIds
    })
  }

  const handleUpdateProductInfo = async (values: any) => {
    await axios.post(`/product/${productId ? 'update' : 'create'}`, {
      ...values,
      id: productId || undefined
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
      const sku = skuEditList[index]
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
        productId: productId
      }
    })
  }

  const handleEditSku = async (editList: any[]) => {
    const colorInfo = colorRef.current?.getData()
    const unitInfo = unitRef.current?.getData()
    let colorRemoveIds = []
    let unitRemoveIds = []
    let tagRemoveIds = []
    if (colorInfo.removeIds?.length) {
      colorRemoveIds = colorInfo.removeIds
    }
    if (unitInfo.removeIds?.length) {
      unitRemoveIds = colorInfo.removeIds
    }
    if (unitInfo.tagRemoveIds?.length) {
      tagRemoveIds = colorInfo.removeIds
    }
    await axios.post(`/product-sku/edit`, {
      editList,
      colorRemoveIds,
      unitRemoveIds,
      tagRemoveIds,
      productId: productId
    })
  }

  const handleSave = async (values: any) => {
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

    if (skuInfo) {
      return
    }

    setLoading(true)
    const errorMessageList: string[] = []

    handleUpdateProductInfo(values).catch(() => {
      errorMessageList.push('商品基本信息保存失败')
    })

    if (bannerInfo) {
      const { image, video } = bannerInfo
      handleBannerEdit(image.upload, video.upload, [...image.removeIds, ...video.removeIds]).catch(
        () => {
          errorMessageList.push('商品详情图片视频保存失败')
        }
      )
    }

    if (summaryInfo) {
      const { editList, removeIds } = summaryInfo
      handleSummaryEdit(editList, removeIds).catch(() => {
        errorMessageList.push('商品详情文字简介保存失败')
      })
    }

    let colorData: any = {}
    let unitData: any = {}
    let isError = false
    if (colorInfo) {
      const { editList, removeIds, fileRemoveIds } = colorInfo
      colorData = await handleColorEdit(editList, removeIds, fileRemoveIds).catch(() => {
        isError = true
        errorMessageList.push('商品颜色保存失败')
      })
    }
    if (unitInfo) {
      const { editList, removeIds, tagRemoveIds } = unitInfo
      unitData = await handleUnitEdit(editList, removeIds, tagRemoveIds).catch(() => {
        isError = true
        errorMessageList.push('商品规格保存失败')
      })
    }
    if (isError) {
      message.error(errorMessageList.join('，'))
      return
    } else {
      console.log(colorData, unitData)
      if (colorData?.length) {
        const { editList } = skuInfo

        const skuEditList: any[] = handleFormSkuData(colorData, unitData, editList)
        handleEditSku(skuEditList).catch(() => {
          isError = true
          errorMessageList.push('商品SKU保存失败')
        })
      }
    }

    if (!errorMessageList.length) {
      message.success('保存成功')
    } else {
      message.error(errorMessageList.join('，'))
    }
    setLoading(false)
  }

  return (
    <PageContainer breadcrumbRender={false}>
      <Spin spinning={loading}>
        <ProForm
          className={'series-details'}
          layout="horizontal"
          submitter={
            isEdit
              ? {
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
                            props.form?.validateFields?.().then(async () => {
                              const res: Record<string, any> = await axios.get(
                                `/product/details/${productId}`
                              )
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
                                        message.success('商品保存并上架成功')
                                      })
                                  }
                                })
                              }
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
            return productId ? await axios.get(`/product/details/${productId}`) : {}
          }}
        >
          <Card title="基础信息" className={'card'} bordered={false}>
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
                <ProFormText
                  fieldProps={{
                    readOnly: !isEdit
                  }}
                  label={'商品编码'}
                  name="code"
                  rules={[{ required: true, message: '请输入商品编码' }]}
                  placeholder="请输入商品编码"
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
            </Row>
          </Card>
        </ProForm>
        <Card title="商品详情" className={'card'} bordered={false} style={{ marginBottom: '24px' }}>
          <Banner ref={detailsRef} />
        </Card>
        <Card title="商品颜色" className={'card'} bordered={false} style={{ marginBottom: '24px' }}>
          <Color
            ref={colorRef}
            onUpdate={(data) => {
              setColorList(data)
            }}
          />
        </Card>
        <Card title="规格管理" className={'card'} bordered={false} style={{ marginBottom: '24px' }}>
          <Unit
            ref={unitRef}
            onUpdate={(data) => {
              setUnitList(data)
            }}
          />
        </Card>
        <Card title="SKU管理" className={'card'} bordered={false}>
          <Sku ref={skuRef} colorList={colorList} unitList={unitList} />
        </Card>
      </Spin>
    </PageContainer>
  )
}

export default ProductDetails
