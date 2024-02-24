import React, { useEffect, useState } from 'react'
import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { ProForm, ProFormItem, ProList } from '@ant-design/pro-components'
import { DndContext, DragEndEvent, PointerSensor, useSensor } from '@dnd-kit/core'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, Col, Descriptions, Flex, Image, Input, Modal, Row, Upload, UploadFile } from 'antd'

import axios from '@/utils/axios.ts'

import './color.scss'

const { confirm } = Modal

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
  const [colorList, setColorList] = useState<any[]>([])
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
      setColorList(list)
      setColorLoading(false)
    })
  }

  useEffect(() => {
    getColorList()
  }, [])

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

    setColorList(
      colorList.map((d) => {
        const { name, fileList: list } = d
        return {
          ...d,
          fileList: name === item.name ? [...newFileList] : list
        }
      })
    )
  }

  const handleSmallChange = (data: any, item: any) => {
    const { fileList: newFileList } = data

    setColorList(
      colorList.map((d) => {
        const { name, smallFileList } = d
        return {
          ...d,
          smallFileList: name === item.name ? [...newFileList] : smallFileList
        }
      })
    )
  }

  const uploadButton = (
    <button style={{ border: 0, background: 'none' }} type="button">
      <PlusOutlined />
    </button>
  )

  const handleColorNameChange = (val: any, item: any) => {
    setColorList(
      colorList.map((d) => {
        const { name, id } = d
        return {
          ...d,
          name: id === item.id ? val : name
        }
      })
    )
  }

  const handleAddColor = () => {
    setColorList([
      ...colorList,
      {
        name: '',
        smallFileList: [],
        fileList: [],
        id: Date.now(),
        uid: Date.now()
      }
    ])
  }

  const sensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 10 }
  })

  const onDragEnd = (event: DragEndEvent, item: any) => {
    const { active, over } = event
    if (!over) return
    if (active.id !== over.id) {
      const list = item.fileList

      const activeIndex = list.findIndex((d: any) => d.uid === active.id)
      const overIndex = list.findIndex((d: any) => d.uid === over.id)
      const sortList = arrayMove(list, activeIndex, overIndex)

      setColorList(
        colorList.map((d: any) => {
          return {
            ...d,
            fileList: d.uid === item.uid ? sortList : d.fileList
          }
        })
      )
    }
  }

  const onListItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    if (active.id !== over.id) {
      setColorList((prev) => {
        const activeIndex = prev.findIndex((i) => i.id === active.id)
        const overIndex = prev.findIndex((i) => i.id === over?.id)
        return arrayMove(prev, activeIndex, overIndex)
      })
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

  interface DraggableListItemProps {
    item: any
  }

  const DraggableListItem = ({ item }: DraggableListItemProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: item.id
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
        <div className={'color-card-item'}>
          <Row justify={'space-between'} align={'top'}>
            <Col flex={1} style={{ marginRight: '16px' }}>
              <ProFormItem label={'颜色名称'} className={'color-name'}>
                <Input
                  defaultValue={item.name}
                  placeholder="请输入颜色名称"
                  onBlur={(val) => {
                    handleColorNameChange(val.target.value, item)
                  }}
                />
              </ProFormItem>
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
            <Col>
              <Button
                type="link"
                style={{ marginLeft: '16px' }}
                onClick={() => {
                  confirm({
                    title: '确认操作',
                    content: '确认删除该颜色吗?',
                    onOk: async () => {
                      setColorList(colorList.filter((d) => d.id !== item.id))
                    }
                  })
                }}
              >
                删除
              </Button>
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
      </div>
    )
  }

  return (
    <>
      <ProForm
        className={'series-details'}
        layout="horizontal"
        submitter={false}
        onValuesChange={(changeValues) => console.log(changeValues)}
      >
        <Descriptions
          items={descList}
          size={'small'}
          contentStyle={{ color: 'rgba(0, 0, 0, 0.45)' }}
        />

        <Flex justify={'end'} align={'center'}>
          <Button
            key="primary"
            type={'primary'}
            onClick={() => {
              handleAddColor()
            }}
          >
            <PlusOutlined /> 新建
          </Button>
        </Flex>

        <DndContext sensors={[sensor]} onDragEnd={(e) => onListItemDragEnd(e)}>
          <SortableContext
            items={colorList.map((i: any) => i.id)}
            strategy={horizontalListSortingStrategy}
          >
            <ProList<any>
              className={'color-card'}
              pagination={false}
              rowSelection={false}
              loading={colorLoading}
              grid={{ gutter: 16, column: 3 }}
              dataSource={colorList}
              size={'small'}
              renderItem={(item) => {
                return <DraggableListItem item={item} />
              }}
            />
          </SortableContext>
        </DndContext>
      </ProForm>

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
    </>
  )
}

export default Color
