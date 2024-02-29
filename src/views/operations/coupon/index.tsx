import { useRef, useState } from 'react'
import { CloseCircleFilled, PlusOutlined } from '@ant-design/icons'
import {
  ActionType,
  ModalForm,
  PageContainer,
  ProColumns,
  ProFormDateRangePicker,
  ProFormDigit,
  ProFormText,
  ProTable
} from '@ant-design/pro-components'
import { Badge, Button, DatePicker, Form, message, Modal, Select } from 'antd'
import dayjs from 'dayjs'
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
      title: '剩余次数',
      hideInSearch: true,
      dataIndex: 'lastCount',
      render: (_, row: any) => {
        const { validCount, usageCount } = row
        return validCount - usageCount
      }
    },
    {
      title: '有效期',
      dataIndex: 'validDate',
      render: (_, row: any) => {
        const { validStartDate, validEndDate } = row
        return `${dayjs(Number(validStartDate)).format('YYYY-MM-DD')} - ${dayjs(
          Number(validEndDate)
        ).format('YYYY-MM-DD')}`
      },
      renderFormItem: () => {
        return <DatePicker.RangePicker inputReadOnly />
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
          perms.includes('edit-coupon') && record.isActive && (
            <a
              key="modify"
              onClick={() => {
                const { validStartDate, validEndDate, ...other } = record
                form.setFieldsValue({
                  ...other,
                  validDate: [dayjs(Number(validStartDate)), dayjs(Number(validEndDate))]
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
              key="records"
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
    const { validDate, ...other } = data
    axios
      .post(`/coupon/${id ? 'update' : 'create'}`, {
        id: id || undefined,
        ...other,
        validStartDate: dayjs(validDate[0]).valueOf(),
        validEndDate: dayjs(validDate[1]).valueOf()
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
    <PageContainer breadcrumbRender={false}>
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
                  code: '',
                  faceValue: '',
                  thresholdValue: '',
                  validCount: '',
                  usageCount: '',
                  validDate: '',
                  id: ''
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
          const { pageSize, current, validDate = [], faceValue, thresholdValue, ...other } = params
          const [validStartDate, validEndDate] = validDate
          const { records, total }: { records: any; total: number } = await axios.post(
            '/coupon/page',
            {
              size: pageSize,
              current,
              ...(validStartDate
                ? {
                    validStartDate: dayjs(validStartDate).valueOf(),
                    validEndDate: dayjs(validEndDate).valueOf()
                  }
                : {}),
              faceValue: faceValue ? Number(faceValue) : undefined,
              thresholdValue: thresholdValue ? Number(thresholdValue) : undefined,
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
        modalProps={{
          destroyOnClose: true,
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
          placeholder={'请输入4-50位CODE'}
          fieldProps={{
            maxLength: 50
          }}
          rules={[
            {
              required: true,
              message: '请输入4-50位CODE'
            },
            () => ({
              validator(_, value) {
                if (value && (value.length < 4 || value.length > 50)) {
                  return Promise.reject(new Error('请输入4-50位CODE'))
                }
                return Promise.resolve()
              }
            })
          ]}
        />
        <ProFormDigit
          min={0.01}
          name="faceValue"
          label="面值"
          placeholder={'请输入面值'}
          fieldProps={{
            precision: 2
          }}
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
          min={0.02}
          name="thresholdValue"
          label="门槛"
          fieldProps={{
            precision: 2
          }}
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
          fieldProps={{ precision: 0 }}
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
        <ProFormDateRangePicker
          width={368}
          name="validDate"
          label="有效期"
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
    </PageContainer>
  )
}

export default OperationsCoupon
