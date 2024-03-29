import { useRef, useState } from 'react'
import { CloseCircleFilled, PlusOutlined } from '@ant-design/icons'
import {
  ActionType,
  ModalForm,
  PageContainer,
  ProColumns,
  ProFormText,
  ProFormTreeSelect,
  ProTable
} from '@ant-design/pro-components'
import { Badge, Button, Form, message, Modal, Select } from 'antd'
import lodash from 'lodash'

import axios from '@/utils/axios.ts'

const { confirm } = Modal

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo

const getPermList = (): Promise<any> => {
  return axios.get('/perm/tree')
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
  const [selectList, setSelectList] = useState<string[]>([])
  const [removeList, setRemoveList] = useState<string[]>([])

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
            placeholder={'请选择'}
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
      width: 110,
      render: (_, record) => {
        return [
          perms.includes('edit-role') && (
            <a
              key="modify"
              onClick={async () => {
                const permTree = await getPermList()
                setPermList(permTree)

                const details = await getRoleDetails(record.id)
                setSelectList([])
                setRemoveList([])
                form.setFieldsValue({
                  ...details,
                  perms: details.perms.map((d: any) => {
                    const { children, name, id } = d
                    return {
                      label: name,
                      value: id,
                      children
                    }
                  })
                })

                setModalInfo({
                  open: true,
                  title: '编辑角色'
                })
              }}
            >
              编辑
            </a>
          ),
          perms.includes('edit-role') && (
            <a
              key="active"
              onClick={() => {
                confirm({
                  title: '确认操作',
                  content: '确认更改角色状态吗?',
                  onOk: async () => {
                    await handleActive(record)
                  }
                })
              }}
            >
              {record.isActive ? '停用' : '启用'}
            </a>
          ),
          perms.includes('delete-role') && (
            <a
              key="delete"
              onClick={() => {
                confirm({
                  title: '确认操作',
                  content: '确认删除角色吗?',
                  onOk: async () => {
                    await handleDelete(record)
                  }
                })
              }}
            >
              删除
            </a>
          )
        ]
      }
    }
  ]

  const handleUpdate = async (data: any) => {
    const { code, name } = data
    const selectIds = [...new Set(selectList)].filter((item) => item && !removeList.includes(item))
    const removeIds = [...new Set(removeList)].filter((item) => item && !selectList.includes(item))

    const id = form.getFieldValue('id')
    await axios
      .post(`/role/${id ? 'update' : 'create'}`, {
        id: id || undefined,
        code,
        name,
        selectIds: selectIds.length ? selectIds : undefined,
        removeIds: removeIds.length ? removeIds : undefined
      })
      .then(async () => {
        message.success(`角色${id ? '编辑' : '新建'}成功`)
        actionRef.current?.reloadAndRest?.()
        setModalInfo({
          open: false
        })
      })
  }

  const handleActive = async (data: any) => {
    await axios
      .post(`/role/active`, {
        id: data.id,
        isActive: !data.isActive
      })
      .then(async () => {
        message.success('角色状态修改成功')
        actionRef.current?.reloadAndRest?.()
      })
  }

  const handleDelete = async (data: any) => {
    await axios.get(`/role/delete/${data.id}`).then(async () => {
      message.success('删除角色成功')
      actionRef.current?.reloadAndRest?.()
    })
  }

  return (
    <PageContainer breadcrumbRender={false}>
      <ProTable
        rowKey="id"
        headerTitle="角色列表"
        actionRef={actionRef}
        columns={columns}
        search={{
          labelWidth: 'auto'
        }}
        toolBarRender={() => [
          perms.includes('add-role') && (
            <Button
              type="primary"
              key="primary"
              onClick={async () => {
                setSelectList([])
                setRemoveList([])
                form.setFieldsValue({
                  name: '',
                  code: '',
                  id: '',
                  perms: []
                })

                const records = await getPermList()
                setPermList(records)

                setModalInfo({
                  open: true,
                  title: '新建角色'
                })
              }}
            >
              <PlusOutlined /> 新建
            </Button>
          )
        ]}
        request={async (params) => {
          const { pageSize, current, ...other } = params
          const { records, total }: { records: any; total: number } = await axios.post(
            '/role/page',
            {
              size: pageSize,
              current,
              ...lodash.omitBy(other, (value) => !value && value !== false)
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
          hideOnSinglePage: true
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
        modalProps={{
          destroyOnClose: true,
          onCancel: () => {
            setModalInfo({ open: false })
          }
        }}
        onFinish={async (values) => {
          await handleUpdate(values)
        }}
      >
        <ProFormText
          name="name"
          label="角色名"
          placeholder={'请输入1-20位角色名'}
          fieldProps={{
            maxLength: 20
          }}
          rules={[
            {
              required: true,
              message: '请输入1-20位角色名'
            },
            () => ({
              validator(_, value) {
                if (value && value.length > 10) {
                  return Promise.reject(new Error('请输入1-20位角色名'))
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
          fieldProps={{
            maxLength: 20
          }}
          rules={[
            {
              required: true,
              message: '请输入角色code'
            }
          ]}
        />
        <ProFormTreeSelect
          name="perms"
          label="权限"
          allowClear
          fieldProps={{
            fieldNames: {
              label: 'name',
              value: 'id',
              children: 'children'
            },
            treeCheckable: true,
            treeCheckStrictly: true,
            showCheckedStrategy: 'SHOW_ALL',
            maxTagCount: 3,
            maxTagPlaceholder: '点击查看更多...',
            treeDefaultExpandAll: true,
            onChange: (_value, _label, extra: Record<string, any>) => {
              const { triggerValue, checked } = extra
              if (checked) {
                setSelectList([...selectList, triggerValue])
              } else {
                setRemoveList([...removeList, triggerValue])
              }
            }
          }}
          request={async () => {
            return permList
          }}
          rules={[
            {
              required: true,
              message: '请选择权限'
            }
          ]}
          placeholder={'请选择权限'}
        ></ProFormTreeSelect>
      </ModalForm>
    </PageContainer>
  )
}

export default SystemRole
