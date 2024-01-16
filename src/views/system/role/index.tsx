import { useRef, useState } from 'react'
import { CloseCircleFilled, PlusOutlined } from '@ant-design/icons'
import {
  ActionType,
  ModalForm,
  ProColumns,
  ProFormSelect,
  ProFormText,
  ProTable
} from '@ant-design/pro-components'
import { Badge, Button, Form, message, Modal, Select } from 'antd'
import lodash from 'lodash'

import axios from '@/utils/axios.ts'

import './style.scss'

const { confirm } = Modal

const getPermList = (): Promise<any> => {
  return axios.post('/perm/page', {
    size: 10000,
    current: 1,
    isActive: true
  })
}

const getRoleDetails = (id: string): Promise<any> => {
  return axios.get(`/role/details/${id}`)
}

function SystemRole() {
  const actionRef = useRef<ActionType>()
  const [modalInfo, setModalInfo] = useState<Record<string, any>>({
    open: false,
    title: '编辑角色'
  })
  const [permList, setPermList] = useState<any[]>([])
  const [form] = Form.useForm()

  const columns: ProColumns[] = [
    {
      title: '角色名',
      dataIndex: 'name'
    },
    {
      title: '角色code',
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
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      ellipsis: false,
      width: 100,
      render: (_, record) => {
        return [
          <a
            key="modify"
            onClick={async () => {
              const { records } = await getPermList()
              setPermList(records)

              const details = await getRoleDetails(record.id)
              form.setFieldsValue({
                ...details,
                perms: details.perms.map((d: any) => d.id)
              })

              setModalInfo({
                open: true,
                title: '编辑角色'
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
                content: '确认更改角色状态吗?',
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
                content: '确认删除角色吗?',
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
    axios
      .post(`/role/${id ? 'update' : 'create'}`, {
        id: id || undefined,
        ...data
      })
      .then(async () => {
        message.success('角色编辑成功')
        actionRef.current?.reloadAndRest?.()
        setModalInfo({
          open: false
        })
      })
  }

  const handleActive = (data: any) => {
    axios
      .post(`/role/active`, {
        id: data.id,
        isActive: !data.isActive
      })
      .then(async () => {
        message.success('角色状态修改成功')
        actionRef.current?.reloadAndRest?.()
      })
  }

  const handleDelete = (data: any) => {
    axios.get(`/role/delete/${data.id}`).then(async () => {
      message.success('删除角色成功')
      actionRef.current?.reloadAndRest?.()
    })
  }

  return (
    <>
      <ProTable
        rowKey="id"
        headerTitle="角色列表"
        actionRef={actionRef}
        columns={columns}
        search={{
          labelWidth: 'auto'
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={async () => {
              form.setFieldsValue({
                name: '',
                code: '',
                id: '',
                perms: []
              })

              const { records } = await getPermList()
              setPermList(records)

              setModalInfo({
                open: true,
                title: '新建角色'
              })
            }}
          >
            <PlusOutlined /> 新建
          </Button>
        ]}
        request={async (params) => {
          console.log(params)
          const { pageSize, current, ...other } = params
          const { records, total }: { records: any; total: number } = await axios.post(
            '/role/page',
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
          hideOnSinglePage: true,
          onChange: (page) => console.log(page)
        }}
      />

      <ModalForm<{
        name: string
        code: string
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
          label="角色名"
          placeholder={'请输入1-50位角色名'}
          rules={[
            {
              required: true,
              message: '请输入1-50位角色名'
            },
            () => ({
              validator(_, value) {
                if (value && value.length > 10) {
                  return Promise.reject(new Error('请输入1-50位角色名'))
                }
                return Promise.resolve()
              }
            })
          ]}
        />
        <ProFormText
          name="code"
          label="角色CODE"
          placeholder={'请输入角色code'}
          rules={[
            {
              required: true,
              message: '请输入角色code'
            }
          ]}
        />
        <ProFormSelect
          name="perms"
          label="权限"
          mode="multiple"
          options={permList.map((d) => {
            return {
              label: d.name,
              value: d.id
            }
          })}
          rules={[
            {
              required: true,
              message: '请选择权限'
            }
          ]}
          placeholder={'请选择权限'}
        ></ProFormSelect>
      </ModalForm>
    </>
  )
}

export default SystemRole
