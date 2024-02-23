import React, { useEffect, useState } from 'react'
import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import {
  ModalForm,
  ProForm,
  ProFormItem,
  ProFormText,
  ProFormUploadDragger,
  ProList
} from '@ant-design/pro-components'
import { DndContext, DragEndEvent, PointerSensor, useSensor } from '@dnd-kit/core'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Col, Descriptions, Flex, Form, Image, Modal, Row, Space, Upload, UploadFile } from 'antd'

import axios from '@/utils/axios.ts'

import './color.scss'

const { confirm } = Modal

let rawColorList: any[]

const descList = [
  {
    key: '1',
    label: '1.素材限制',
    span: 3,
    children: <p>图片视频宽高比例为3:4。图片宽高均大于1200px，大小10M以内；视频时长5s-60s以内</p>
  },
  {
    key: '2',
    label: '2.数量限制',
    span: 3,
    children: <p>单个颜色中，图片视频最少需上传1个，最多可上传9个</p>
  },
  {
    key: '3',
    label: '3.排序限制',
    span: 3,
    children: <p>排序影响商城展示顺序，可手动拖拽排序</p>
  }
]

function Color({ productId }: { productId: string | undefined }) {
  const [modalInfo, setModalInfo] = useState<Record<string, any>>({
    open: false,
    title: '编辑颜色'
  })
  const [colorForm] = Form.useForm()
  const [colorList, setColorList] = useState([])
  const [colorLoading, setColorLoading] = React.useState<boolean>(false)
  const [previewInfo, setPreviewInfo] = useState({
    visible: false,
    url: ''
  })

  const getColorList = () => {
    setColorLoading(true)
    axios.get(`/color/list/${productId}`).then((res: any) => {
      const list = res.map((d: any) => {
        return {
          ...d,
          smallFileList: [],
          fileList: []
        }
      })
      rawColorList = []
      rawColorList.push(...list)
      setColorList(handleRenderFormat(list))
      setColorLoading(false)
    })
  }

  useEffect(() => {
    getColorList()
  }, [])

  // const handleDragSortEnd = async (
  //   _beforeIndex: number,
  //   _afterIndex: number,
  //   newDataSource: any
  // ) => {
  //   setColorList(newDataSource)
  // }

  const handlePreview = (file: UploadFile) => {
    const url = file.url || file.thumbUrl
    if (!url) return
    setPreviewInfo({
      visible: true,
      url
    })
  }

  const handleChange = (data: any, item: any) => {
    const { fileList: newFileList } = data

    rawColorList = [
      ...rawColorList.map((d) => {
        const { name, fileList: list } = d
        return {
          ...d,
          fileList: name === item.name ? [...newFileList] : list
        }
      })
    ]
    setColorList(handleRenderFormat(rawColorList))
  }

  const handleSmallChange = (data: any, item: any) => {
    const { fileList: newFileList } = data

    rawColorList = [
      ...rawColorList.map((d) => {
        const { name, smallFileList } = d
        return {
          ...d,
          smallFileList: name === item.name ? [...newFileList] : smallFileList
        }
      })
    ]
    setColorList(handleRenderFormat(rawColorList))
  }

  const uploadButton = (
    <button style={{ border: 0, background: 'none' }} type="button">
      <PlusOutlined />
    </button>
  )

  const handleRenderFormat = (res: any) => {
    return res.map((item: any) => ({
      title: item.name,
      actions: [
        <a
          key="delete"
          onClick={() => {
            confirm({
              title: '确认操作',
              content: '确认删除该颜色吗?',
              onOk: async () => {
                const list = rawColorList.filter((d) => d.name !== item.name)
                rawColorList = [...list]
                setColorList(handleRenderFormat(list))
              }
            })
          }}
        >
          删除
        </a>
      ],
      avatar: 'https://gw.alipayobjects.com/zos/antfincdn/UCSiy1j6jx/xingzhuang.svg',
      content: (
        <div
          style={{
            flex: 1
          }}
        >
          <Row justify={'space-between'} align={'top'}>
            <Col flex={1} style={{ marginRight: '16px' }}>
              <ProFormText
                className={'color-name'}
                label={'颜色名称'}
                name="name"
                placeholder="请输入颜色名称"
              />
            </Col>
            <Col>
              <ProFormItem label={'缩略图'}>
                <Upload
                  className={'color-upload small-upload'}
                  accept={'.png,.jpg,.jpeg'}
                  listType="picture-card"
                  fileList={item.smallFileList}
                  maxCount={1}
                  onPreview={handlePreview}
                  onChange={(data) => handleSmallChange(data, item)}
                  beforeUpload={() => false}
                >
                  {item.smallFileList.length >= 1 ? null : uploadButton}
                </Upload>
              </ProFormItem>
            </Col>
          </Row>
          <Flex vertical={true} justify={'space-between'} align={'flex-start'}>
            <Flex style={{ width: '100%' }} justify={'start'} align={'start'}>
              <ProFormItem label={'图片视频'}>
                <DndContext sensors={[sensor]} onDragEnd={(e) => onDragEnd(e, item)}>
                  <SortableContext
                    items={item.fileList.map((i: any) => i.uid)}
                    strategy={horizontalListSortingStrategy}
                  >
                    <Upload
                      className={'color-upload'}
                      accept={
                        item.fileList.some((f: any) => f.type.includes('video'))
                          ? '.png,.jpg,.jpeg'
                          : '.png,.jpg,.jpeg,.mp4'
                      }
                      listType="picture-card"
                      fileList={item.fileList}
                      maxCount={9}
                      onPreview={handlePreview}
                      onChange={(data) => handleChange(data, item)}
                      beforeUpload={(file: any) => {
                        if (file.type.includes('video')) {
                          file.url = URL.createObjectURL(file)
                        }
                        return false
                      }}
                      itemRender={(originNode, file) => {
                        return <DraggableUploadListItem originNode={originNode} file={file} />
                      }}
                    >
                      {item.fileList.length >= 10 ? null : uploadButton}
                    </Upload>
                  </SortableContext>
                </DndContext>
              </ProFormItem>
            </Flex>
          </Flex>
        </div>
      )
    }))
  }

  const sensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 10 }
  })

  const onDragEnd = (event: DragEndEvent, item: any) => {
    const { active, over } = event
    if (!over) return
    if (active.id !== over?.id) {
      if (active.id !== over.id) {
        const list = item.fileList

        const activeIndex = list.findIndex((d: any) => d.uid === active.id)
        const overIndex = list.findIndex((d: any) => d.uid === over.id)
        const sortList = arrayMove(list, activeIndex, overIndex)

        setColorList(
          handleRenderFormat(
            rawColorList.map((d: any) => {
              return {
                ...d,
                fileList: d.uid === item.uid ? sortList : d.fileList
              }
            })
          )
        )
      }
    }
  }

  interface DraggableUploadListItemProps {
    originNode: React.ReactElement<any, string | React.JSXElementConstructor<any>>
    file: UploadFile<any>
  }

  const DraggableUploadListItem = ({ originNode, file }: DraggableUploadListItemProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: file.uid
    })

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      cursor: 'move',
      height: '100%'
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={isDragging ? 'is-dragging' : ''}
        {...attributes}
        {...listeners}
      >
        <div className={originNode.props.className}>
          {originNode.props.children[0]}
          <div className={originNode.props.children[2].props.className}>
            <EyeOutlined
              onClick={() => {
                handlePreview(file)
              }}
            />
            {originNode.props.children[2].props.children[2]}
          </div>
        </div>
      </div>
    )
  }

  return (
    <ProForm className={'series-details'} layout="horizontal" submitter={false}>
      <Space direction={'vertical'}>
        <Descriptions
          items={descList}
          size={'small'}
          contentStyle={{ color: 'rgba(0, 0, 0, 0.45)' }}
        />
        <ProList<any>
          className={'color-card'}
          pagination={false}
          rowSelection={false}
          loading={colorLoading}
          grid={{ gutter: 16, column: 3 }}
          metas={{
            title: {},
            type: {},
            avatar: {},
            content: {},
            actions: {
              cardActionProps: 'extra'
            }
          }}
          dataSource={colorList}
        />
        <ModalForm<{
          name: string
          link: string
          desc: string
        }>
          open={modalInfo.open}
          initialValues={{}}
          title={modalInfo.title}
          form={colorForm}
          autoFocusFirstInput
          width={400}
          modalProps={{
            onCancel: () => {
              setModalInfo({ open: false })
            }
          }}
          onFinish={async (values) => {
            console.log(values)
            return true
          }}
        >
          <ProFormText
            name="name"
            label="颜色名称"
            placeholder={'请输入1-20位颜色名称'}
            fieldProps={{
              maxLength: 20
            }}
            rules={[
              () => ({
                validator(_, value) {
                  if (value && value.length > 10) {
                    return Promise.reject(new Error('请输入1-20位颜色名称'))
                  }
                  return Promise.resolve()
                }
              })
            ]}
          />
          <ProFormText
            name="desc"
            label="描述"
            placeholder={'请输入描述'}
            fieldProps={{
              maxLength: 50
            }}
            rules={[
              () => ({
                validator(_, value) {
                  if (value && value.length > 50) {
                    return Promise.reject(new Error('描述最多50个字'))
                  }
                  return Promise.resolve()
                }
              })
            ]}
          />
          <ProFormUploadDragger
            name="fileList"
            label="图片"
            description=""
            rules={[
              {
                required: true,
                message: '请选择图片'
              }
            ]}
            fieldProps={{
              maxCount: 10,
              accept: '.png,.jpg,.jpeg',
              customRequest: () => {},
              onRemove: () => {}
            }}
          />
        </ModalForm>
        <Image
          width={200}
          style={{ display: 'none' }}
          preview={{
            visible: previewInfo.visible,
            onVisibleChange: (value) => {
              setPreviewInfo({
                visible: value,
                url: ''
              })
            },
            toolbarRender: () => <span></span>,
            ...(previewInfo.url.includes('blob')
              ? {
                  imageRender: () => {
                    return (
                      <video width="420" height="440" controls>
                        <source src={previewInfo.url} type="video/mp4" />
                        您的浏览器不支持 Video 标签。
                      </video>
                    )
                  }
                }
              : {
                  src: previewInfo.url
                })
          }}
        />
      </Space>
    </ProForm>
  )
}

export default Color
