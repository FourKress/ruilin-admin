#!/bin/bash

branch=""
env=""

if [ "$1" == "test" ]
then
  branch="test"
  env="test"
elif [ "$1" == "prod" ]
then
  branch="main"
  env="production"
else
  echo '---参数错误，执行失败---'
  exit 1
fi

echo $env

echo "---开始执行git checkout $branch---"
git checkout $branch
echo '---开始执行git pull---'
git pull
echo '---git pull执行完毕，pnpm install---'
pnpm i
echo '---pnpm install执行完毕，开始执行pnpm build---'
tsc && vite build --mode $env
echo '---pnpm build执行完毕 服务启动成功---'
