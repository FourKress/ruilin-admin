import { useRef, useState } from 'react'
import { CloseCircleFilled, PlusOutlined } from '@ant-design/icons'
import {
  ActionType,
  ModalForm,
  ProColumns,
  ProFormText,
  ProTable
} from '@ant-design/pro-components'
import { Badge, Button, Form, message, Select } from 'antd'
import lodash from 'lodash'

import axios from '@/utils/axios.ts'

import './style.scss'

function SystemPerm() {
  const actionRef = useRef<ActionType>()
  const [modalInfo, setModalInfo] = useState<Record<string, any>>({
    open: false,
    title: '修改权限'
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
      dataIndex: 'isDelete',
      defaultFilteredValue: null,
      render: (status) => {
        const color = status ? 'red' : 'blue'
        return [<Badge key={color} color={color} text={status ? '已停用' : '使用中'} />]
      },
      renderFormItem: () => {
        return (
          <Select
            allowClear={{
              clearIcon: <CloseCircleFilled />
            }}
            options={[
              { value: false, label: '使用中' },
              { value: true, label: '已停用' }
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
                title: '修改权限'
              })
            }}
          >
            修改
          </a>,
          <a
            key="active"
            onClick={() => {
              handleActive(record)
            }}
          >
            {record.isDelete ? '启用' : '停用'}
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
        message.success('权限修改成功')
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
        isDelete: !data.isDelete
      })
      .then(async () => {
        message.success('状态修改成功')
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
              ...lodash.omitBy(other, lodash.isEmpty)
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
