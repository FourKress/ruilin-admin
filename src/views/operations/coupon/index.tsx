import { useRef, useState } from 'react'
import { CloseCircleFilled, PlusOutlined } from '@ant-design/icons'
import {
  ActionType,
  ModalForm,
  ProColumns,
  ProFormDatePicker,
  ProFormDigit,
  ProFormText,
  ProTable
} from '@ant-design/pro-components'
import { Badge, Button, DatePicker, Form, message, Modal, Select } from 'antd'
import * as dayjs from 'dayjs'
import lodash from 'lodash'

import axios from '@/utils/axios.ts'

const { confirm } = Modal

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo

function OperationsCoupon() {
  const actionRef = useRef<ActionType>()
  const [modalInfo, setModalInfo] = useState<Record<string, any>>({
    open: false,
    title: '编辑优惠码'
  })
  const [form] = Form.useForm()

  const columns: ProColumns[] = [
    {
      title: 'CODE',
      dataIndex: 'code'
    },
    {
      title: '面值',
      dataIndex: 'faceValue'
    },
    {
      title: '门槛',
      dataIndex: 'thresholdValue'
    },
    {
      title: '有效次数',
      hideInSearch: true,
      dataIndex: 'validCount'
    },
    {
      title: '使用次数',
      hideInSearch: true,
      dataIndex: 'usageCount'
    },
    {
      title: '有效期',
      dataIndex: 'validDate',
      render: (date: any) => {
        return dayjs(date).format('YYYY-MM-DD')
      },
      renderFormItem: () => {
        return (
          <DatePicker
            inputReadOnly
            disabledDate={(current) => {
              return current && current < dayjs().endOf('day')
            }}
          />
        )
      }
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      render: (status) => {
        const color = status ? 'blue' : 'red'
        return [<Badge key={color} color={color} text={status ? '有效' : '失效'} />]
      },
      renderFormItem: () => {
        return (
          <Select
            placeholder={'请选择'}
            allowClear={{
              clearIcon: <CloseCircleFilled />
            }}
            options={[
              { value: true, label: '有效' },
              { value: false, label: '失效' }
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
      width: 130,
      render: (_, record) => {
        return [
          perms.includes('edit-coupon') && (
            <a
              key="modify"
              onClick={() => {
                form.setFieldsValue({
                  ...record
                })
                setModalInfo({
                  open: true,
                  title: '编辑优惠码'
                })
              }}
            >
              编辑
            </a>
          ),
          perms.includes('edit-coupon') && (
            <a
              key="modify"
              onClick={() => {
                console.log('使用记录')
              }}
            >
              使用记录
            </a>
          ),
          perms.includes('delete-coupon') && (
            <a
              key="delete"
              onClick={() => {
                confirm({
                  title: '确认操作',
                  content: '确认删除优惠码吗?',
                  onOk() {
                    handleDelete(record)
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

  const handleUpdate = (data: any) => {
    const id = form.getFieldValue('id')
    const { validDate, ...ohter } = data
    console.log(id, data)
    axios
      .post(`/coupon/${id ? 'update' : 'create'}`, {
        id: id || undefined,
        ...ohter,
        validDate: dayjs(validDate).valueOf()
      })
      .then(async () => {
        message.success(`优惠码${id ? '编辑' : '新建'}成功`)
        actionRef.current?.reloadAndRest?.()
        setModalInfo({
          open: false
        })
      })
  }

  const handleDelete = (data: any) => {
    axios.get(`/coupon/delete/${data.id}`).then(async () => {
      message.success('删除优惠码成功')
      actionRef.current?.reloadAndRest?.()
    })
  }

  return (
    <>
      <ProTable
        search={{
          labelWidth: 'auto'
        }}
        rowKey="id"
        headerTitle="优惠码列表"
        actionRef={actionRef}
        columns={columns}
        toolBarRender={() => [
          perms.includes('add-coupon') && (
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
                  title: '新建优惠码'
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
            '/coupon/page',
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
          hideOnSinglePage: true,
          onChange: (page) => console.log(page)
        }}
      />

      <ModalForm<{
        code: string
        faceValue: number
        thresholdValue: number
        validCount: number
        usageCount: number
        validDate: number
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
          name="code"
          label="CODE"
          placeholder={'请输入1-50位CODE'}
          fieldProps={{
            maxLength: 50
          }}
          rules={[
            {
              required: true,
              message: '请输入1-50位CODE'
            },
            () => ({
              validator(_, value) {
                if (value && value.length > 10) {
                  return Promise.reject(new Error('请输入1-50位CODE'))
                }
                return Promise.resolve()
              }
            })
          ]}
        />
        <ProFormDigit
          min={1}
          name="faceValue"
          label="面值"
          placeholder={'请输入面值'}
          rules={[
            {
              required: true,
              message: '请输入面值'
            },
            () => ({
              validator(_, value) {
                if (value < 0 || isNaN(value)) {
                  return Promise.reject(new Error('请输入正整数面值'))
                }
                return Promise.resolve()
              }
            })
          ]}
        />
        <ProFormDigit
          min={2}
          name="thresholdValue"
          label="门槛"
          placeholder={'请输入门槛'}
          rules={[
            {
              required: true,
              message: '请输入门槛'
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (value < 0 || isNaN(value)) {
                  return Promise.reject(new Error('请输入正整数门槛'))
                }
                if (getFieldValue('faceValue') >= value) {
                  return Promise.reject(new Error('门槛值必须大于面值'))
                }
                return Promise.resolve()
              }
            })
          ]}
        />
        <ProFormDigit
          min={1}
          max={99}
          name="validCount"
          label="有效次数"
          placeholder={'请输入有效次数'}
          rules={[
            {
              required: true,
              message: '请输入有效次数'
            },
            () => ({
              validator(_, value) {
                if (value < 0 || isNaN(value)) {
                  return Promise.reject(new Error('请输入正整数有效次数'))
                }
                if (value > 99) {
                  return Promise.reject(new Error('有效次数最大不能超过99'))
                }
                return Promise.resolve()
              }
            })
          ]}
        />
        <ProFormDatePicker
          width={368}
          name="validDate"
          label="有效期"
          placeholder={'请选择有效期'}
          rules={[
            {
              required: true,
              message: '请选择有效期'
            }
          ]}
          fieldProps={{
            disabledDate: (current) => {
              return current && current < dayjs().endOf('day')
            }
          }}
        />
      </ModalForm>
    </>
  )
}

export default OperationsCoupon
