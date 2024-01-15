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

function SystemUser() {
  const actionRef = useRef<ActionType>()
  const [openModal, setOpenModal] = useState(false)
  const [currentItem, setCurrentItem] = useState<any>({})
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
      title: '最后登录时间',
      dataIndex: 'lastLoginTime',
      hideInSearch: true,
      valueType: 'dateTime'
    },
    {
      title: '描述',
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
            onClick={() => {
              setCurrentItem(record)
              setOpenModal(true)
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
          </a>,
          <a
            key="resetPwd"
            onClick={() => {
              handleResetPwd(record)
            }}
          >
            重置密码
          </a>
        ]
      }
    }
  ]

  const handleUpdate = (data: any) => {
    axios
      .post('/user/update', {
        id: currentItem.id,
        ...data
      })
      .then(async () => {
        message.success('用户修改成功')
        actionRef.current?.reloadAndRest?.()
        setOpenModal(false)
      })
  }

  const handleActive = (data: any) => {
    axios
      .post(`/user/active`, {
        id: data.id,
        isDelete: !data.isDelete
      })
      .then(async () => {
        message.success('状态修改成功')
        actionRef.current?.reloadAndRest?.()
      })
  }

  const handleResetPwd = (data: any) => {
    axios.get(`/user/resetPwd/${data.id}`).then(async () => {
      message.success('重置成功')
      actionRef.current?.reloadAndRest?.()
    })
  }

  return (
    <>
      <ProTable
        rowKey="id"
        headerTitle="查询表格"
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
              console.log('toolBarRender')
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
          onChange: (page) => console.log(page)
        }}
      />

      <ModalForm<{
        username: string
        phoneNum: string
        remark: string
      }>
        open={openModal}
        initialValues={{
          ...currentItem
        }}
        title="修改用户"
        form={form}
        autoFocusFirstInput
        width={500}
        submitTimeout={2000}
        modalProps={{
          destroyOnClose: true,
          onCancel: () => setOpenModal(false)
        }}
        onFinish={async (values) => {
          handleUpdate(values)
        }}
      >
        <ProFormText
          name="username"
          label="用户名"
          placeholder={'请输入2-10位用户名'}
          rules={[
            {
              required: true,
              message: '请输入2-10位用户名'
            },
            () => ({
              validator(_, value) {
                if (value && value.length > 10) {
                  return Promise.reject(new Error('请输入2-10位用户名'))
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
