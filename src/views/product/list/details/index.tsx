import { FC, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  FooterToolbar,
  PageContainer,
  ProForm,
  ProFormText,
  ProFormTextArea
} from '@ant-design/pro-components'
import { Button, Card, Col, message, Modal, Row, Space, Spin } from 'antd'

import axios from '@/utils/axios.ts'
import { uploadFile } from '@/utils/fileUtils.ts'
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
    return await axios.post(`/product/${productId ? 'update' : 'create'}`, {
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
    const hasSkuEmptyData = skuInfo.editList.some((d: any) => !d.stock || !d.price)
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

    if (skuInfo) {
      // return false
    }

    setLoading(true)
    let createProductStatus = true
    if (!productId) {
      const res = await handleUpdateProductInfo(values).catch(() => {
        createProductStatus = false
      })
      productId = res.id
    } else {
      handleUpdateProductInfo(values).then(() => {})
    }
    if (!createProductStatus) {
      setLoading(false)
      return false
    }

    if (bannerInfo) {
      const { image, video } = bannerInfo
      handleBannerEdit(image.upload, video.upload, [...image.removeIds, ...video.removeIds]).then(
        () => {}
      )
    }

    if (summaryInfo) {
      const { editList, removeIds } = summaryInfo
      handleSummaryEdit(editList, removeIds).then(() => {})
    }

    let colorData: any = {}
    let unitData: any = {}
    let isError = false
    if (colorInfo) {
      const { editList, removeIds, fileRemoveIds } = colorInfo
      colorData = await handleColorEdit(editList, removeIds, fileRemoveIds).catch(() => {
        isError = true
      })
    }
    if (unitInfo) {
      const { editList, removeIds, tagRemoveIds } = unitInfo
      unitData = await handleUnitEdit(editList, removeIds, tagRemoveIds).catch(() => {
        isError = true
      })
    }
    if (isError) {
      navigate(`/product/list/details/1/${productId}`)
      setRefreshKey(Date.now())
      setLoading(false)
      return false
    } else {
      if (colorData?.length) {
        const { editList } = skuInfo

        const skuEditList: any[] = handleFormSkuData(colorData, unitData, editList)
        await handleEditSku(skuEditList).catch(() => {
          isError = true
        })
      }
    }

    navigate(`/product/list/details/1/${productId}`)
    setRefreshKey(Date.now())

    if (!isError) {
      message.success('保存成功')
    }
    setLoading(false)

    return !isError
  }

  const handleActive = async () => {
    await axios.post(`/product/active`, {
      id: productId,
      isActive: true
    })
  }

  return (
    <PageContainer title={'商品详情'} breadcrumbRender={false} key={refreshKey}>
      <Spin
        size="large"
        tip={<div style={{ marginTop: '12px' }}>数据保存中</div>}
        fullscreen={true}
        spinning={loading}
      />
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
                                    navigate(-1)
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
                          confirm({
                            title: '确认操作',
                            content: '确认保存并上架该商品吗?',
                            onOk() {
                              props.form
                                ?.validateFields?.()
                                .then(async (values: Record<string, any>) => {
                                  console.log(values)
                                  const saveStatus = await handleSave(values, true)
                                  console.log(saveStatus)
                                  if (!saveStatus) return
                                  setLoading(true)
                                  await handleActive()
                                  message.success('商品保存并上架成功')
                                  setLoading(false)
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
          if (productId) {
            const res: any = await axios.get(`/product/details/${productId}`)
            const { code, name, desc, online_code, online_name, online_desc } = res
            if (isEdit)
              return {
                name,
                code,
                desc
              }
            return {
              code: online_code,
              name: online_name,
              desc: online_desc
            }
          }
          return {}
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
    </PageContainer>
  )
}

export default ProductDetails
