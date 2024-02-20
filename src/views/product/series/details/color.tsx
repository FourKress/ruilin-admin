import React, { useEffect, useState } from 'react'
import { FileImageOutlined, PlusOutlined } from '@ant-design/icons'
import {
  DragSortTable,
  ModalForm,
  ProColumns,
  ProFormText,
  ProFormUploadDragger
} from '@ant-design/pro-components'
import { Button, Form, Image, message, Modal } from 'antd'

import axios from '@/utils/axios.ts'
import { uploadFile } from '@/utils/fileUtils.ts'

const { confirm } = Modal

function Color({ productId }: { productId: string | undefined }) {
  const [modalInfo, setModalInfo] = useState<Record<string, any>>({
    open: false,
    title: '编辑颜色'
  })
  const [fileList, setFileList] = useState<any>([])
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
      setColorList(res)
      setColorLoading(false)
    })
  }

  useEffect(() => {
    getColorList()
  }, [])

  const handleDragSortEnd = async (
    _beforeIndex: number,
    _afterIndex: number,
    newDataSource: any
  ) => {
    setColorList(newDataSource)
    setColorLoading(true)
    const ids = newDataSource.map((d: any) => d.id)
    axios
      .post(`/color/batchSort`, {
        ids
      })
      .then(async () => {
        message.success('排序成功')
      })
      .finally(() => {
        setColorLoading(false)
      })
  }

  const handleUpdate = async (data: any) => {
    const id = colorForm.getFieldValue('id')
    const {
      fileList: [file],
      ...other
    } = data
    console.log(fileList, file)

    const { uid, type, name } = file
    const objectKey = `${uid}.${type.replace(/[\w\W]+\//, '')}`

    const isUploadFile = file.status !== 'done'

    if (isUploadFile) {
      await uploadFile(file.originFileObj, objectKey)
    }

    await axios.post(`/color/${id ? 'update' : 'create'}`, {
      id: id || undefined,
      ...other,
      objectKey,
      fileName: name,
      uid,
      fileType: type,
      productId: productId
    })

    message.success(`颜色${id ? '编辑' : '新建'}成功`)
    getColorList()
  }

  const handleDelete = (data: any) => {
    setColorLoading(true)
    axios
      .get(`/color/delete/${data.id}`)
      .then(async () => {
        message.success('删除颜色成功')
        getColorList()
      })
      .finally(() => {
        setColorLoading(false)
      })
  }

  const columns: ProColumns[] = [
    {
      title: '排序',
      dataIndex: 'sort',
      width: 60,
      className: 'drag-visible'
    },
    {
      title: '颜色名',
      dataIndex: 'name'
    },
    {
      title: '描述',
      dataIndex: 'desc'
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      ellipsis: false,
      width: 100,
      render: (_, record) => {
        return [
          <a
            key="modify"
            onClick={() => {
              const fileList = [
                {
                  uid: record.uid,
                  name: record.fileName,
                  type: record.fileType,
                  status: 'done'
                }
              ]
              colorForm.setFieldsValue({
                ...record,
                fileList
              })
              setFileList(fileList)
              setModalInfo({
                open: true,
                title: '编辑颜色'
              })
            }}
          >
            编辑
          </a>,

          <a
            key="preview"
            onClick={() => {
              setPreviewInfo({
                visible: true,
                url: record.url
              })
            }}
          >
            预览
          </a>,

          <a
            key="delete"
            onClick={() => {
              confirm({
                title: '确认操作',
                content: '确认删除颜色吗?',
                onOk() {
                  handleDelete(record)
                }
              })
            }}
          >
            删除
          </a>
        ]
      }
    }
  ]

  return (
    <>
      <DragSortTable
        dragSortKey="sort"
        onDragSortEnd={handleDragSortEnd}
        dataSource={colorList}
        loading={colorLoading}
        options={{
          reload: () => {
            getColorList()
          }
        }}
        search={false}
        rowKey="id"
        headerTitle=""
        columns={columns}
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              colorForm.setFieldsValue({
                name: '',
                link: '',
                desc: '',
                fileList: [],
                id: ''
              })
              setModalInfo({
                open: true,
                title: '新建颜色'
              })
            }}
          >
            <PlusOutlined /> 新建
          </Button>
        ]}
        pagination={false}
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
          await handleUpdate(values)
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
            onRemove: () => {
              setFileList([])
            },
            onChange: ({ fileList }) => {
              setFileList(fileList)
            },
            iconRender: () => <FileImageOutlined />,
            ...(colorForm.getFieldValue('id')
              ? {
                  fileList: fileList
                }
              : {})
          }}
        />
      </ModalForm>

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
    </>
  )
}

export default Color
