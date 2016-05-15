# lordstone 的进展 #
这个是dotamax的网络爬虫，初步完成爬出来比赛页面。\n
经过修改可以应用于别的网站甚至内容 \n
const.py 和 utility.py 都是功能性的function文件 \n
策略是先把所有的league找到然后存在saved_data里面，
再通过saved_data的league目录找到所有的match，存进每个league的文件夹。\n
然后找每个match里面的details. \n
重点是把已经爬到的信息存起来 
==============


