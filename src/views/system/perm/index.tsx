import { useRef, useState } from 'react'
import { CloseCircleFilled, PlusOutlined } from '@ant-design/icons'
import {
  ActionType,
  ModalForm,
  ProColumns,
  ProFormText,
  ProTable
} from '@ant-design/pro-components'
import { Badge, Button, Form, message, Modal, Select } from 'antd'
import lodash from 'lodash'

import axios from '@/utils/axios.ts'

import './style.scss'

const { confirm } = Modal

function SystemPerm() {
  const actionRef = useRef<ActionType>()
  const [modalInfo, setModalInfo] = useState<Record<string, any>>({
    open: false,
    title: '编辑权限'
  })
  const [form] = Form.useForm()

  const columns: ProColumns[] = [
    {
      title: '权限名',
      dataIndex: 'name'
    },
    {
      title: '权限code',
      dataIndex: 'code'
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      defaultFilteredValue: null,
      render: (status) => {
        const color = status ? 'blue' : 'red'
        return [<Badge key={color} color={color} text={status ? '使用中' : '已停用'} />]
      },
      renderFormItem: () => {
        return (
          <Select
            allowClear={{
              clearIcon: <CloseCircleFilled />
            }}
            options={[
              { value: true, label: '使用中' },
              { value: false, label: '已停用' }
            ]}
          />
        )
      }
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
      width: 160,
      render: (_, record) => {
        return [
          <a
            key="modify"
            onClick={() => {
              form.setFieldsValue({
                ...record
              })
              setModalInfo({
                open: true,
                title: '编辑权限'
              })
            }}
          >
            编辑
          </a>,
          <a
            key="active"
            onClick={() => {
              confirm({
                title: '确认操作',
                content: '确认更改权限状态吗?',
                onOk() {
                  handleActive(record)
                }
              })
            }}
          >
            {record.isActive ? '停用' : '启用'}
          </a>,
          <a
            key="delete"
            onClick={() => {
              confirm({
                title: '确认操作',
                content: '确认删除权限吗?',
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

  const handleUpdate = (data: any) => {
    const id = form.getFieldValue('id')
    const pid = form.getFieldValue('pid')
    axios
      .post(`/perm/${id ? 'update' : 'create'}`, {
        id: id || undefined,
        pid,
        ...data
      })
      .then(async () => {
        message.success('权限编辑成功')
        actionRef.current?.reloadAndRest?.()
        setModalInfo({
          open: false
        })
      })
  }

  const handleActive = (data: any) => {
    axios
      .post(`/perm/active`, {
        id: data.id,
        isActive: !data.isActive
      })
      .then(async () => {
        message.success('权限状态修改成功')
        actionRef.current?.reloadAndRest?.()
      })
  }

  const handleDelete = (data: any) => {
    axios.get(`/perm/delete/${data.id}`).then(async () => {
      message.success('删除权限成功')
      actionRef.current?.reloadAndRest?.()
    })
  }

  return (
    <>
      <ProTable
        rowKey="id"
        headerTitle="权限列表"
        actionRef={actionRef}
        columns={columns}
        search={{
          labelWidth: 'auto'
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              form.setFieldsValue({
                name: '',
                code: '',
                desc: '',
                id: '',
                pid: '0'
              })
              setModalInfo({
                open: true,
                title: '新建权限'
              })
            }}
          >
            <PlusOutlined /> 新建
          </Button>
        ]}
        request={async (params) => {
          const { pageSize, current, ...other } = params
          const { records, total }: { records: any; total: number } = await axios.post(
            '/perm/page',
            {
              size: pageSize,
              current,
              ...lodash.pickBy(other, lodash.isEmpty)
            }
          )
          return {
            data: records,
            total,
            success: true
          }
        }}
        pagination={{
          pageSize: 20,
          onChange: (page) => console.log(page)
        }}
      />

      <ModalForm<{
        name: string
        code: string
        desc: string
      }>
        open={modalInfo.open}
        initialValues={{}}
        title={modalInfo.title}
        form={form}
        autoFocusFirstInput
        width={400}
        submitTimeout={2000}
        modalProps={{
          onCancel: () => {
            setModalInfo({ open: false })
          }
        }}
        onFinish={async (values) => {
          handleUpdate(values)
        }}
      >
        <ProFormText
          name="name"
          label="权限名"
          placeholder={'请输入1-50位权限名'}
          rules={[
            {
              required: true,
              message: '请输入1-50位权限名'
            },
            () => ({
              validator(_, value) {
                if (value && value.length > 10) {
                  return Promise.reject(new Error('请输入1-50位权限名'))
                }
                return Promise.resolve()
              }
            })
          ]}
        />
        <ProFormText
          name="code"
          label="权限CODE"
          placeholder={'请输入权限code'}
          rules={[
            {
              required: true,
              message: '请输入权限code'
            }
          ]}
        />
        <ProFormText
          name="desc"
          label="描述"
          placeholder={'请输入描述'}
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
      </ModalForm>
    </>
  )
}

export default SystemPerm
