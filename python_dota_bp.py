#-*-coding:utf8-*-
import requests,numpy,itertools
from collections import Counter
from lxml import etree
def division (a,b):
    c = a/float(b)
    return c
def sort(a):
    for k in range(len(a)):
        (a[k][0],a[k][1]) = (a[k][1],a[k][0])
    a.sort(reverse=True)
hea = {'User-Agent':'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36'}
number_of_match = int(raw_input('Please input number of matches:\n'))
arrangement = int(raw_input('Please input arrangement of hero:\n'))
best_hero_time = int(raw_input('Please input best ranking:\n'))
left_match = number_of_match % 20
if left_match == 0:
    match_page = number_of_match/20+1
else:
    match_page = number_of_match/20+2
url = 'http://www.dotabuff.com/esports/matches?'
summary_win_hero_name = []
summary_lose_hero_name = []
for i in range(1, match_page):
    web = url + 'page=%s' % i
    html1 = requests.get(web, headers=hea)
    selector1 = etree.HTML(html1.text)
    win_hero = selector1.xpath('//td[@class="cell-xlarge r-none-mobile winner"]/div/img[@class="img-icon"]/@src')
    lose_hero = selector1.xpath('//td[@class="cell-xlarge r-none-mobile"]/div/img[@class="img-icon"]/@src')
    if (left_match != 0) and (i == match_page-1):
        win_hero = win_hero[0:left_match*5]
        lose_hero = lose_hero[0:left_match*5]
    for win in win_hero:
        src = win.split('/')[-1]
        hero_name = '-'.join(src.split('-')[0:-1])
        summary_win_hero_name.append(hero_name)
    for lose in lose_hero:
        src = lose.split('/')[-1]
        hero_name = '-'.join(src.split('-')[0:-1])
        summary_lose_hero_name.append(hero_name)

if arrangement == 1:
    aa = dict(Counter(summary_win_hero_name).items())
    win_hero_name = aa.keys()
    win_hero_name_time = aa.values()
    bb = dict(Counter(summary_lose_hero_name + summary_win_hero_name).items())
    summary_hero_name = bb.keys()
    summary_hero_time = bb.values()
    hero_win_rate = [0]*len(win_hero_name)
    q = [0]*len(win_hero_name)
    i = 0
    for each in win_hero_name:
        qq = summary_hero_time[summary_hero_name.index(each)]
        hero_win_rate[i] = win_hero_name_time[i]/float(qq)
        q[i] = [win_hero_name[i], hero_win_rate[i]*qq,hero_win_rate[i],qq]
        i += 1
    sort(q)
    result = q[0:best_hero_time]
    with open('hero.txt', 'w') as f:
        for each2 in range(0, best_hero_time):
            f.write(result[each2][1]+'      '+str(result[each2][3])+'       '+str(result[each2][2]) +'\n')


else:
    ee = []
    bb = []
    aa = numpy.array(summary_win_hero_name).reshape(number_of_match,5)
    dd = numpy.array(summary_lose_hero_name).reshape(number_of_match,5)
    for each1 in range(0, number_of_match):
        ee += list(itertools.combinations(dd[each1], arrangement))
        bb += list(itertools.combinations(aa[each1], arrangement))
    win_hero_name = dict(Counter(bb).items()).keys()
    win_hero_name_time = dict(Counter(bb).items()).values()
    summary_hero_name = dict(Counter(bb+ee).items()).keys()
    summary_hero_time = dict(Counter(bb+ee).items()).values()
    hero_win_rate = [0]*len(win_hero_name)
    q = [0]*len(win_hero_name)
    i = 0
    for each in win_hero_name:
        qq = summary_hero_time[summary_hero_name.index(each)]
        hero_win_rate[i] = win_hero_name_time[i]/float(qq)
        q[i] = [win_hero_name[i], hero_win_rate[i]*qq,hero_win_rate[i],qq]
        i += 1
    sort(q)
    result = q[0:best_hero_time]
    with open('hero.txt', 'w') as f:
        for each2 in range(0, best_hero_time):
            f.write(str(result[each2][1])+'      '+str(result[each2][3])+'       '+str(result[each2][2]) +'\n')




