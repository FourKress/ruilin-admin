#!/bin/bash

branch=""

if [ "$1" == "test" ]
then
  branch="test"
elif [ "$1" == "prod" ]
then
  branch="main"
else
  echo '---参数错误，执行失败---'
  exit 1
fi

echo "---开始执行git checkout $branch---"
git checkout $branch
echo '---开始执行git pull---'
git pull
echo '---git pull执行完毕，pnpm install---'
pnpm i
echo '---pnpm install执行完毕，开始执行pnpm build---'
pnpm build:$1
echo '---pnpm build执行完毕 服务启动成功---'
