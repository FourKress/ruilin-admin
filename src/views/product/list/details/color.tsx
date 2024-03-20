import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { EyeOutlined, PlayCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { DragSortTable, ProColumns } from '@ant-design/pro-components'
import { DndContext, DragEndEvent, PointerSensor, useSensor } from '@dnd-kit/core'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, Descriptions, Image, Input, message, Modal, Upload, UploadFile } from 'antd'

import axios from '@/utils/axios.ts'
import { checkFileSize } from '@/utils/fileUtils.ts'

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

interface ColorRef {
  getData: () => any
}

const Color = forwardRef<ColorRef, { onUpdate: (data: any[]) => void }>(({ onUpdate }, ref) => {
  const { id: productId, edit } = useParams()
  const isEdit = edit === '1'

  const [colorList, setColorList] = useState<any[]>([])
  const [colorRemoveList, setColorRemoveList] = useState<any[]>([])
  const [fileRemoveList, setFileRemoveList] = useState<any[]>([])
  const [colorLoading, setColorLoading] = React.useState<boolean>(false)
  const [previewInfo, setPreviewInfo] = useState({
    visible: false,
    url: '',
    type: ''
  })

  const videoRef = useRef<any>()

  const getColorList = () => {
    if (!productId) return
    setColorLoading(true)
    axios
      .get(`/product-color/${isEdit ? 'list' : 'online-list'}/${productId}`)
      .then((res: any) => {
        const list = res.map((d: any) => {
          const fileList: any[] = []

          d.fileList?.forEach((f: any) => {
            const item = {
              uid: f.uid,
              name: f.fileName,
              type: f.fileType,
              id: f.id,
              url: f.url,
              status: 'done'
            }

            fileList.push(item)
          })

          return {
            ...d,
            smallFileList: d.objectKey
              ? [
                  {
                    uid: d.uid,
                    name: d.fileName,
                    type: d.fileType,
                    id: d.id,
                    url: d.url,
                    status: 'done'
                  }
                ]
              : [],
            fileList
          }
        })
        setColorList(list)
      })
      .finally(() => {
        setColorLoading(false)
      })
  }

  useEffect(() => {
    getColorList()
  }, [])

  useEffect(() => {
    if (!colorList.length) {
      onUpdate([])
    }
    const list = colorList.filter((d: any) => d.name)
    if (!list.length) return
    onUpdate(list)
  }, [colorList])

  useImperativeHandle(ref, () => ({
    getData: (): any => {
      return {
        removeIds: colorRemoveList,
        fileRemoveIds: fileRemoveList,
        editList: colorList.filter((d: any) => d.name)
      }
    }
  }))

  const handlePreview = (file: UploadFile) => {
    const url = file.url || file.thumbUrl
    if (!url) return
    setPreviewInfo({
      visible: true,
      url,
      type: file.type || ''
    })
  }

  const handleChange = (data: any, item: any) => {
    const { file, fileList: newFileList } = data

    const length = newFileList.length
    if (length && length > item.fileList.length && !checkFileSize(file)) {
      return
    }

    setColorList(
      colorList.map((d) => {
        const { id, fileList: list } = d
        return {
          ...d,
          fileList: id === item.id ? [...newFileList] : list
        }
      })
    )
  }

  const handleSmallChange = (data: any, item: any) => {
    const { file, fileList: newFileList } = data

    if (newFileList.length && !checkFileSize(file)) {
      return
    }

    setColorList(
      colorList.map((d) => {
        const { id, smallFileList } = d
        return {
          ...d,
          smallFileList: id === item.id ? [...newFileList] : smallFileList
        }
      })
    )
  }

  const uploadButton = isEdit && (
    <button style={{ border: 0, background: 'none' }} type="button">
      <PlusOutlined />
    </button>
  )

  const handleAddColor = () => {
    setColorList([
      ...colorList,
      {
        name: '',
        smallFileList: [],
        fileList: [],
        id: Date.now()
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
            fileList: d.id === item.id ? sortList : d.fileList
          }
        })
      )
    }
  }

  const handleDragSortEnd = async (
    _beforeIndex: number,
    _afterIndex: number,
    newDataSource: any
  ) => {
    setColorList(newDataSource)
  }

  interface DraggableUploadListItemProps {
    originNode: React.ReactElement<any, string | React.JSXElementConstructor<any>>
    file: any
  }

  const DraggableUploadListItem = ({ originNode, file }: DraggableUploadListItemProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: file.uid
    })

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      cursor: isEdit ? 'move' : 'default',
      height: '100%'
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={isDragging ? 'is-dragging' : ''}
        {...(isEdit ? attributes : {})}
        {...(isEdit ? listeners : {})}
      >
        <div className={originNode.props.className}>
          {file.type.includes('video') ? (
            <div
              className={originNode.props.children[0].props.className}
              style={{ marginTop: '6px' }}
            >
              <PlayCircleOutlined />
            </div>
          ) : (
            originNode.props.children[0]
          )}

          <div className={originNode.props.children[2].props.className}>
            <EyeOutlined
              onClick={() => {
                handlePreview(file)
              }}
            />
            {isEdit && originNode.props.children[2].props.children[2]}
          </div>
        </div>
      </div>
    )
  }

  const columns: ProColumns[] = [
    {
      title: '颜色名称',
      dataIndex: 'name',
      width: 120,
      render: (_, record) => {
        return (
          <Input
            readOnly={!isEdit}
            defaultValue={record.name}
            placeholder="请输入颜色名称"
            onBlur={async (e) => {
              const value = e.target.value
              if (value && colorList.some((d: any) => d.id !== record.id && d.name === value)) {
                message.error('颜色名称重复，请重新输入')
                setColorList([...colorList])
              } else {
                setColorList(
                  colorList.map((d: any) => {
                    return {
                      ...d,
                      name: record.id === d.id ? value : d.name
                    }
                  })
                )
              }
            }}
          />
        )
      }
    },
    {
      title: '颜色描述',
      dataIndex: 'desc',
      ellipsis: true,
      width: 230,
      render: (_, record) => {
        return (
          <Input
            readOnly={!isEdit}
            defaultValue={record.desc}
            placeholder="请输入颜色描述"
            onBlur={async (e) => {
              const value = e.target.value
              setColorList(
                colorList.map((d: any) => {
                  return {
                    ...d,
                    desc: record.id === d.id ? value : d.desc
                  }
                })
              )
            }}
          />
        )
      }
    },
    {
      title: '头图',
      dataIndex: 'smallFileList',
      width: 60,
      ellipsis: true,
      render: (_, record) => {
        return (
          <Upload
            className={'color-upload small-upload'}
            accept={'.png,.jpg,.jpeg'}
            listType="picture-card"
            fileList={record.smallFileList}
            maxCount={1}
            onChange={(data) => handleSmallChange(data, record)}
            beforeUpload={() => false}
            itemRender={(originNode, file) => {
              return (
                <div className={originNode.props.className}>
                  {originNode.props.children[0]}
                  <div className={originNode.props.children[2].props.className}>
                    <EyeOutlined
                      onClick={() => {
                        handlePreview(file)
                      }}
                    />
                    {isEdit && originNode.props.children[2].props.children[2]}
                  </div>
                </div>
              )
            }}
          >
            {record.smallFileList.length >= 1 ? null : uploadButton}
          </Upload>
        )
      }
    },
    {
      title: '图片视频',
      dataIndex: 'fileList',
      ellipsis: true,
      render: (_, record) => {
        return (
          <DndContext sensors={[sensor]} onDragEnd={(e) => onDragEnd(e, record)}>
            <SortableContext
              items={record.fileList.map((i: any) => i.uid)}
              strategy={horizontalListSortingStrategy}
            >
              <Upload
                className={'color-upload'}
                accept={
                  record.fileList.some((f: any) => f.type.includes('video'))
                    ? '.png,.jpg,.jpeg'
                    : '.png,.jpg,.jpeg,.mp4'
                }
                listType="picture-card"
                fileList={record.fileList}
                maxCount={9}
                onChange={(data) => handleChange(data, record)}
                onRemove={(file: any) => {
                  if (productId && file.id) {
                    setFileRemoveList([...fileRemoveList, file.id])
                  }
                }}
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
                {record.fileList.length >= 9 ? null : uploadButton}
              </Upload>
            </SortableContext>
          </DndContext>
        )
      }
    }
  ]

  if (isEdit) {
    columns.unshift({
      title: '排序',
      dataIndex: 'sort',
      width: 40,
      className: 'drag-visible'
    })
    columns.push({
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      ellipsis: false,
      width: 40,
      render: (_, record: Record<string, any>) => {
        return [
          <a
            style={{ color: 'red' }}
            key="delete"
            onClick={() => {
              confirm({
                title: '确认操作',
                content: '确认删除该颜色吗?',
                onOk() {
                  setColorList(colorList.filter((d) => d.id !== record.id))
                  if (productId && record.createTime) {
                    const ids = record.fileList
                      .filter((d: Record<string, any>) => productId && d.id)
                      .map((d: any) => d.id)

                    setFileRemoveList([...fileRemoveList, ...ids])

                    setColorRemoveList([...colorRemoveList, record.id])
                  }
                }
              })
            }}
          >
            删除
          </a>
        ]
      }
    })
  }

  return (
    <>
      <Descriptions
        items={descList}
        size={'small'}
        contentStyle={{ color: 'rgba(0, 0, 0, 0.45)' }}
      />

      <DragSortTable
        className={'color-card'}
        dragSortKey="sort"
        onDragSortEnd={handleDragSortEnd}
        loading={colorLoading}
        dataSource={colorList}
        size={'small'}
        options={{
          reload: false,
          setting: false,
          density: false
        }}
        search={false}
        rowKey="id"
        headerTitle=""
        columns={columns}
        pagination={false}
        toolBarRender={() => [
          isEdit && (
            <Button
              type="primary"
              key="primary"
              onClick={() => {
                handleAddColor()
              }}
            >
              <PlusOutlined /> 新建
            </Button>
          )
        ]}
      />

      <Image
        width={200}
        style={{ display: 'none' }}
        preview={{
          visible: previewInfo.visible,
          onVisibleChange: (value) => {
            videoRef?.current?.pause()
            setPreviewInfo({
              visible: value,
              url: '',
              type: ''
            })
          },
          toolbarRender: () => <span></span>,
          ...(previewInfo.url.includes('blob') || previewInfo.type.includes('video')
            ? {
                imageRender: () => {
                  return (
                    <video ref={videoRef} width="420" height="440" controls>
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
})

export default Color
