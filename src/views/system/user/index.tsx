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
import md5 from 'md5'

import axios from '@/utils/axios.ts'

import './style.scss'

const { confirm } = Modal

const getRoleList = (): Promise<any> => {
  return axios.post('/role/page', {
    size: 10000,
    current: 1,
    isActive: true
  })
}

const getUserDetails = (id: string): Promise<any> => {
  return axios.get(`/user/details/${id}`)
}

function SystemUser() {
  const actionRef = useRef<ActionType>()
  const [modalInfo, setModalInfo] = useState<Record<string, any>>({
    open: false,
    title: '编辑用户'
  })
  const [roleList, setRoleList] = useState<any[]>([])
  const [form] = Form.useForm()

  const columns: ProColumns[] = [
    {
      title: '用户名',
      dataIndex: 'username'
    },
    {
      title: '手机号',
      dataIndex: 'phoneNum'
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
      title: '最后登录时间',
      dataIndex: 'lastLoginTime',
      hideInSearch: true,
      valueType: 'dateTime'
    },
    {
      title: '描述',
      width: 360,
      dataIndex: 'remark'
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
            onClick={async () => {
              const { records } = await getRoleList()
              setRoleList(records)

              const details = await getUserDetails(record.id)
              form.setFieldsValue({
                ...details,
                roles: details.roles.map((d: any) => d.id)
              })
              setModalInfo({
                open: true,
                title: '编辑用户'
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
                content: '确认更改用户状态吗?',
                onOk() {
                  handleActive(record)
                }
              })
            }}
          >
            {record.isActive ? '停用' : '启用'}
          </a>,
          <a
            key="resetPwd"
            onClick={() => {
              confirm({
                title: '确认操作',
                content: '确认重置用户密码吗?',
                onOk() {
                  handleResetPwd(record)
                }
              })
            }}
          >
            重置密码
          </a>,
          <a
            key="delete"
            onClick={() => {
              confirm({
                title: '确认操作',
                content: '确认删除该用户吗?',
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
    let params = {}
    if (id) {
      params = {
        id,
        ...data
      }
    } else {
      const { firstPassword, secondPassword: _, ...other } = data
      params = {
        ...other,
        password: md5(firstPassword).substring(8, 26)
      }
    }
    axios
      .post(`/user/${id ? 'update' : 'register'}`, {
        id: id || undefined,
        ...params
      })
      .then(async () => {
        message.success('用户编辑成功')
        actionRef.current?.reloadAndRest?.()
        setModalInfo({
          open: false
        })
      })
  }

  const handleActive = (data: any) => {
    axios
      .post(`/user/active`, {
        id: data.id,
        isActive: !data.isActive
      })
      .then(async () => {
        message.success('用户状态修改成功')
        actionRef.current?.reloadAndRest?.()
      })
  }

  const handleResetPwd = (data: any) => {
    axios.get(`/user/resetPwd/${data.id}`).then(async () => {
      message.success('重置密码成功')
      actionRef.current?.reloadAndRest?.()
    })
  }

  const handleDelete = (data: any) => {
    axios.get(`/user/delete/${data.id}`).then(async () => {
      message.success('删除用户成功')
      actionRef.current?.reloadAndRest?.()
    })
  }

  return (
    <>
      <ProTable
        rowKey="id"
        headerTitle="用户列表"
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
                username: '',
                phoneNum: '',
                remark: '',
                id: '',
                password: '',
                roles: []
              })

              const { records } = await getRoleList()
              setRoleList(records)

              setModalInfo({
                open: true,
                title: '新建用户'
              })
            }}
          >
            <PlusOutlined /> 新建
          </Button>
        ]}
        request={async (params) => {
          const { pageSize, current, ...other } = params
          const { records, total }: { records: any; total: number } = await axios.post(
            '/user/page',
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
        username: string
        phoneNum: string
        remark: string
      }>
        open={modalInfo.open}
        initialValues={{}}
        title={modalInfo.title}
        form={form}
        autoFocusFirstInput
        width={400}
        submitTimeout={2000}
        modalProps={{
          destroyOnClose: true,
          onCancel: () => setModalInfo({ open: false })
        }}
        onFinish={async (values) => {
          handleUpdate(values)
        }}
      >
        <ProFormText
          name="username"
          label="用户名"
          placeholder={'请输入1-10位用户名'}
          rules={[
            {
              required: true,
              message: '请输入1-10位用户名'
            },
            () => ({
              validator(_, value) {
                if (value && value.length > 10) {
                  return Promise.reject(new Error('请输入1-10位用户名'))
                }
                return Promise.resolve()
              }
            })
          ]}
        />
        <ProFormText
          name="phoneNum"
          label="手机号"
          placeholder={'请输入手机号'}
          rules={[
            {
              required: true,
              message: '请输入手机号'
            },
            () => ({
              validator(_, value) {
                const reg = /^1[3-9]\d{9}$/
                if (value && !reg.test(value)) {
                  return Promise.reject(new Error('请输入11位的手机号'))
                }
                return Promise.resolve()
              }
            })
          ]}
        />
        {!form.getFieldValue('id') && (
          <>
            <ProFormText.Password
              name="firstPassword"
              label="密码"
              placeholder={'请输入6-10位密码'}
              rules={[
                {
                  required: true
                },
                () => ({
                  validator(_, value) {
                    if (value && (value.length < 6 || value.length > 10)) {
                      return Promise.reject(new Error('请输入6-10位密码'))
                    }
                    return Promise.resolve()
                  }
                })
              ]}
            />
            <ProFormText.Password
              name="secondPassword"
              label="确认密码"
              placeholder={'请输入确认密码'}
              dependencies={['firstPassword']}
              rules={[
                {
                  required: true
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('firstPassword') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('两次密码输入不匹配'))
                  }
                })
              ]}
            />
          </>
        )}
        <ProFormSelect
          name="roles"
          label="角色"
          mode="multiple"
          options={roleList.map((d) => {
            return {
              label: d.name,
              value: d.id
            }
          })}
          rules={[
            {
              required: true,
              message: '请选择角色'
            }
          ]}
          placeholder={'请选择角色'}
        ></ProFormSelect>
        <ProFormText
          name="remark"
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

export default SystemUser
