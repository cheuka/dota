#-*-coding:utf8-*-
import requests
import matplotlib.pyplot as plt
from lxml import etree
from Tkinter import _flatten
from collections import Counter
import re
import numpy
def circles(x, y, s, c='b', ax=None, vmin=None, vmax=None, **kwargs):
    """
    Make a scatter of circles plot of x vs y, where x and y are sequence
    like objects of the same lengths. The size of circles are in data scale.

    Parameters+----------------
    ----------
    x,y : scalar or array_like, shape (n, )
        Input data
    s : scalar or array_like, shape (n, )
        Radius of circle in data scale (ie. in data unit)
    c : color or sequence of color, optional, default : 'b'
        `c` can be a single color format string, or a sequence of color
        specifications of length `N`, or a sequence of `N` numbers to be
        mapped to colors using the `cmap` and `norm` specified via kwargs.
        Note that `c` should not be a single numeric RGB or
        RGBA sequence because that is indistinguishable from an array of
        values to be colormapped.  `c` can be a 2-D array in which the
        rows are RGB or RGBA, however.
    ax : Axes object, optional, default: None
        Parent axes of the plot. It uses gca() if not specified.
    vmin, vmax : scalar, optional, default: None
        `vmin` and `vmax` are used in conjunction with `norm` to normalize
        luminance data.  If either are `None`, the min and max of the
        color array is used.  (Note if you pass a `norm` instance, your
        settings for `vmin` and `vmax` will be ignored.)

    Returns
    -------
    paths : `~matplotlib.collections.PathCollection`

    Other parameters
    ----------------
    kwargs : `~matplotlib.collections.Collection` properties
        eg. alpha, edgecolors, facecolors, linewidths, linestyles, norm, cmap

    Examples
    --------
    a = np.arange(11)
    circles(a, a, a*0.2, c=a, alpha=0.5, edgecolor='none')

    License
    --------
    This code is under [The BSD 3-Clause License]
    (http://opensource.org/licenses/BSD-3-Clause)
    """
    from matplotlib.patches import Circle
    from matplotlib.collections import PatchCollection
    import pylab as plt
    #import matplotlib.colors as colors

    if ax is None:
        ax = plt.gca()

    if isinstance(c,basestring):
        color = c     # ie. use colors.colorConverter.to_rgba_array(c)
    else:
        color = None  # use cmap, norm after collection is created
    kwargs.update(color=color)

    if np.isscalar(x):
        patches = [Circle((x, y), s),]
    elif np.isscalar(s):
        patches = [Circle((x_,y_), s) for x_,y_ in zip(x,y)]
    else:
        patches = [Circle((x_,y_), s_) for x_,y_,s_ in zip(x,y,s)]
    collection = PatchCollection(patches, **kwargs)

    if color is None:
        collection.set_array(np.asarray(c))
        if vmin is not None or vmax is not None:
            collection.set_clim(vmin, vmax)

    ax.add_collection(collection)
    ax.autoscale_view()
    return collection
def all_indexs(lst, obj):
    def find_index(lst, obj, start=0):
        try:
            index = lst.index(obj, start)
        except:
            index = -1
        return index

    indexes = []
    i = 0
    while True:
        idx = find_index(lst, obj, i)
        if idx == -1:
            return indexes
        indexes.append(idx)
        i = idx + 1
    return indexes
b = []
def ii(a):
    while a>= 0:
        b.append(a%10)
        a/=10
        if a == 0:
            break
from pylab import *
hea = {'User-Agent':'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36'}
html1 = requests.get('http://www.dotabuff.com/esports/teams',headers = hea)
selector1 = etree.HTML(html1.text)
team = raw_input('Please input your team:\n')
number_of_match = int(raw_input('Please input number of matches:\n'))
form = int(raw_input('Please input the form:\n'))
top_five = int(raw_input('Please input the top five player number:\n'))
ii(top_five)
address = '//div[@id="teams-all"]//img[@alt="'+team+'"]/@data-tooltip-url'
team_data = selector1.xpath(address)[0]
team_data_out = re.sub('/tooltip', '', team_data)
#表格
ax = subplot(aspect='equal')
xlabel("hero")
ylabel("player")
if form == 1:
    title("first hand pick")
elif form == 2:
    title("second hand pick")
else:
    title("summary hand pick")
plt.yticks([0.0, 1.0, 2.0, 3.0, 4.0, 5.0])
plt.xticks([0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0, 3.2, 3.4, 3.6, 3.8, 4.0, 4.2, 4.4, 4.6, 4.8, 5.0, 5.2, 5.4, 5.6, 5.8, 6.0])
plt.xlim(0, 6)
plt.ylim(0, 6)
#
# 战队网页
top_five_player_jpg = [0]*5
team_web = "http://www.dotabuff.com"+team_data_out
html2 = requests.get(team_web,headers = hea)
selector2 = etree.HTML(html2.text)
team_player = selector2.xpath('//td[@class="r-tab-icon"]//@src')[::-1]
for each15 in range(0,5):
    top_five_player_jpg[each15] = team_player[b.index(each15+1)]

summary = [0]*number_of_match
summary_player_match_pick = [0]*number_of_match
hero_pick = [0]*number_of_match
match_precedence = [0]*number_of_match
# for i in range(0, 5):
#     top_five_player_jpg[i] = team_player[Y[i]]
# 战队比赛
team_match_web = "http://www.dotabuff.com"+team_data_out+"/matches"
html3 = requests.get(team_match_web, headers=hea)
selector3 = etree.HTML(html3.text)
match_record = selector3.xpath('//table[@class="table table-striped recent-esports-matches"]//tr/td[@class="cell-mediumlarge"]//text()')[0::2]
team_choice_record = match_record[0:number_of_match]
match = re.findall('cell-mediumlarge"><a class="(.*?)" href="(.*?)">', html3.text, re.S)
for each1 in range(0, number_of_match):
    radiant_hero_player_match_pick = [0]*5
    dire_hero_player_match_pick = [0]*5
    radiant_player_match_pick = [0]*5
    dire_player_match_pick = [0]*5
    matchweb = "http://www.dotabuff.com"+match[each1][1]  #比赛场次
    html4 = requests.get(matchweb, headers=hea)
    selector4 = etree.HTML(html4.text)
    team_choice = selector4.xpath('//div[@class="r-only"]//header[@style="vertical-align: middle"]//@title')
    if len(team_choice) == 0:
        summary[each1] = ["", "", "", "", ""]
        match_precedence[each1] = " "
    else:
        if team_choice[0] == team:
            match_precedence[each1] = selector4.xpath('//div[@class="r-only"]/section[@class="radiant"]/footer/div[@class="picks-inline"]//text()')[0]
            hero_pick[each1] = selector4.xpath('//div[@class="r-only"]/section[@class="radiant"]/footer/div[@class="picks-inline"]/div[@class="pick"]//@alt')
            # x轴判断单场pick次序
            # print radiant_hero_pick
            radiant_hero_player_pick = selector4.xpath('//tr[@class="faction-radiant"]/td/div[@class="image-container image-container-hero image-container-icon"]//@title')
            radiant_player_hero_pick = selector4.xpath('//tr[@class="faction-radiant"]/td[@class="r-none-mobile"]/div/a//@src')
            for number1 in range(0, 5):
                cc = radiant_hero_player_pick.index(hero_pick[each1][number1])
                radiant_player_match_pick[number1] = radiant_player_hero_pick[cc]
            summary_player_match_pick[each1] = radiant_player_match_pick
            for each2 in range(0, 5):
                if top_five_player_jpg[each2] in radiant_player_hero_pick:
                    aa = radiant_player_hero_pick.index(top_five_player_jpg[each2])
                    radiant_hero_player_match_pick[each2] = radiant_hero_player_pick[aa]
                else:
                    radiant_hero_player_match_pick[each2] = " "
            # 5个号的pick的次序
            # print radiant_hero_player_match_pick
            summary[each1] = radiant_hero_player_match_pick
        else:
            match_precedence[each1] = selector4.xpath('//div[@class="r-only"]/section[@class="dire"]/footer/div[@class="picks-inline"]//text()')[0]
            hero_pick[each1] = selector4.xpath('//div[@class="r-only"]/section[@class="dire"]/footer/div[@class="picks-inline"]/div[@class="pick"]//@alt')
            # x轴判断单场pick次序
            # print dire_hero_pick
            dire_hero_player_pick = selector4.xpath('//tr[@class="faction-dire"]/td/div[@class="image-container image-container-hero image-container-icon"]//@title')
            dire_player_hero_pick = selector4.xpath('//tr[@class="faction-dire"]/td[@class="r-none-mobile"]/div/a//@src')
            for number2 in range(0, 5):
                dd = dire_hero_player_pick.index(hero_pick[each1][number2])
                dire_player_match_pick[number2] = dire_player_hero_pick[dd]
            summary_player_match_pick[each1] = dire_player_match_pick
            for each2 in range(0, 5):
                if top_five_player_jpg[each2] in dire_player_hero_pick:
                    bb = dire_player_hero_pick.index(top_five_player_jpg[each2])
                    dire_hero_player_match_pick[each2] = dire_hero_player_pick[bb]
                else:
                    dire_hero_player_match_pick[each2] = " "
            summary[each1] = dire_hero_player_match_pick
array_summary = list(_flatten(summary))
one = array_summary[0::5]
two = array_summary[1::5]
three = array_summary[2::5]
four = array_summary[3::5]
five = array_summary[4::5]
first_hand = []
second_hand = []
for each3 in range(0, number_of_match):
    if match_precedence[each3] == "1":
        first_hand.append(each3)
    else:
        second_hand.append(each3)
first_hand_len = len(first_hand)
second_hand_len = len(second_hand)
first_hand_hero_pick = [0]*first_hand_len
first_hand_player = [0]*first_hand_len
first_hand_team_choice_record = [0]*first_hand_len
second_hand_hero_pick = [0]*second_hand_len
second_hand_player = [0]*second_hand_len
second_hand_team_choice_record = [0]*second_hand_len
one_first_hand_hero_pick = [0]*first_hand_len
two_first_hand_hero_pick = [0]*first_hand_len
three_first_hand_hero_pick = [0]*first_hand_len
four_first_hand_hero_pick = [0]*first_hand_len
five_first_hand_hero_pick = [0]*first_hand_len
one_second_hand_hero_pick = [0]*second_hand_len
two_second_hand_hero_pick = [0]*second_hand_len
three_second_hand_hero_pick = [0]*second_hand_len
four_second_hand_hero_pick = [0]*second_hand_len
five_second_hand_hero_pick = [0]*second_hand_len
first_same_x = []
second_same_x = []
# 先手
if form == 1:
    for each4 in range(0, first_hand_len):
        first_hand_hero_pick[each4] = hero_pick[first_hand[each4]]
        first_hand_player[each4] = summary_player_match_pick[first_hand[each4]]
        first_hand_team_choice_record[each4] = team_choice_record[first_hand[each4]]
        one_first_hand_hero_pick[each4] = one[first_hand[each4]]
        two_first_hand_hero_pick[each4] = two[first_hand[each4]]
        three_first_hand_hero_pick[each4] = three[first_hand[each4]]
        four_first_hand_hero_pick[each4] = four[first_hand[each4]]
        five_first_hand_hero_pick[each4] = five[first_hand[each4]]
    first_hand_hero_pick_summary = one_first_hand_hero_pick+two_first_hand_hero_pick+three_first_hand_hero_pick+four_first_hand_hero_pick+five_first_hand_hero_pick
    first_hand_hero_pick_summary_list = numpy.array(first_hand_hero_pick_summary).reshape(5, len(first_hand_hero_pick_summary)/5)
    for each6 in range(0, 5):
        summary_x_position = []
        summary_win_rate = []
        summary_k = []
        first_hero_type = list(set(first_hand_hero_pick_summary_list[each6]))
        for each7 in range(0, len(first_hero_type)):
            x_summary = 0
            win_time = 0
            k = 0
            x_position = 0.0
            if first_hero_type[each7] == " ":
                pass
            else:
                for each8 in range(0, first_hand_len):
                    if first_hero_type[each7] in first_hand_hero_pick[each8]:
                        if top_five_player_jpg[each6] == first_hand_player[each8][(first_hand_hero_pick[each8].index(first_hero_type[each7]))]:
                            k += 1
                            x_summary += (first_hand_hero_pick[each8].index(first_hero_type[each7])+1)
                            win_time += ((first_hand_team_choice_record[each8]).find("Won Match")+1)
                        else:
                            pass
                    else:
                        pass
                y_position = each6+1
                x_position = x_summary/float(k)
                win_rate = "%.1f%%" % (win_time/float(k)*100)
                summary_x_position.append(x_position)
                summary_win_rate.append(win_rate)
                summary_k.append(k)
        cnt = Counter(summary_x_position)
        for w, v in cnt.iteritems():
            number_position = all_indexs(summary_x_position, w)
            for number3 in range(0, v):
                circles(w, each6+1+number3*0.3, 0.04*summary_k[number_position[number3]], '1', edgecolor='b')
                plt.text(w+0.05*summary_k[number_position[number3]], each6+1+number3*0.3-0.05, first_hero_type[number_position[number3]])
                plt.text(w+0.05*summary_k[number_position[number3]], each6+1+number3*0.3-0.15, summary_k[number_position[number3]])
                plt.text(w+0.05*summary_k[number_position[number3]], each6+1+number3*0.3+0.05, summary_win_rate[number_position[number3]])
    plt.show()

#
# 后手
elif form == 2:
    for each5 in range(0, second_hand_len):
        second_hand_hero_pick[each5] = hero_pick[second_hand[each5]]
        second_hand_player[each5] = summary_player_match_pick[second_hand[each5]]
        second_hand_team_choice_record[each5] = team_choice_record[second_hand[each5]]
        one_second_hand_hero_pick[each5] = one[second_hand[each5]]
        two_second_hand_hero_pick[each5] = two[second_hand[each5]]
        three_second_hand_hero_pick[each5] = three[second_hand[each5]]
        four_second_hand_hero_pick[each5] = four[second_hand[each5]]
        five_second_hand_hero_pick[each5] = five[second_hand[each5]]
    second_hand_hero_pick_summary = one_second_hand_hero_pick+two_second_hand_hero_pick+three_second_hand_hero_pick+four_second_hand_hero_pick+five_second_hand_hero_pick
    second_hand_hero_pick_summary_list = numpy.array(second_hand_hero_pick_summary).reshape(5, len(second_hand_hero_pick_summary)/5)
    for each9 in range(0, 5):
        summary_x_position = []
        summary_win_rate = []
        summary_k = []
        second_hero_type = list(set(second_hand_hero_pick_summary_list[each9]))
        for each10 in range(0, len(second_hero_type)):
            x_summary = 0
            win_time = 0
            k = 0
            x_position = 0.0
            if second_hero_type[each10] == " ":
                pass
            else:
                for each11 in range(0, second_hand_len):
                    if second_hero_type[each10] in second_hand_hero_pick[each11]:
                        if top_five_player_jpg[each9] == second_hand_player[each11][(second_hand_hero_pick[each11].index(second_hero_type[each10]))]:
                            k += 1
                            x_summary += (second_hand_hero_pick[each11].index(second_hero_type[each10])+1)
                            win_time += ((second_hand_team_choice_record[each11]).find("Won Match")+1)
                        else:
                            pass
                    else:
                        pass
                y_position = each9+1
                x_position = x_summary/float(k)
                win_rate = "%.1f%%" % (win_time/float(k)*100)
                summary_x_position.append(x_position)
                summary_win_rate.append(win_rate)
                summary_k.append(k)
        cnt = Counter(summary_x_position)
        for w, v in cnt.iteritems():
            number_position = all_indexs(summary_x_position, w)
            for number4 in range(0, v):
                circles(w, each9+1+number4*0.3, 0.04*summary_k[number_position[number4]], '1', edgecolor='b')
                plt.text(w+0.05*summary_k[number_position[number4]], each9+1+number4*0.3-0.05, second_hero_type[number_position[number4]])
                plt.text(w+0.05*summary_k[number_position[number4]], each9+1+number4*0.3-0.15, summary_k[number_position[number4]])
                plt.text(w+0.05*summary_k[number_position[number4]], each9+1+number4*0.3+0.05, summary_win_rate[number_position[number4]])
    plt.show()
else:
    hero_pick_summary = one+two+three+four+five
    hero_pick_summary_list = numpy.array(hero_pick_summary).reshape(5, len(hero_pick_summary)/5)
    for each12 in range(0, 5):
        summary_x_position = []
        summary_win_rate = []
        summary_k = []
        hero_type = list(set(hero_pick_summary_list[each12]))
        for each13 in range(0, len(hero_type)):
            x_summary = 0
            win_time = 0
            k = 0
            x_position = 0.0
            if hero_type[each13] == " ":
                pass
            else:
                for each14 in range(0, number_of_match):
                    if hero_type[each13] in hero_pick[each14]:
                        if top_five_player_jpg[each12] == summary_player_match_pick[each14][(hero_pick[each14].index(hero_type[each13]))]:
                            k += 1
                            x_summary += (hero_pick[each14].index(hero_type[each13])+1)
                            win_time += ((team_choice_record[each14]).find("Won Match")+1)
                        else:
                            pass
                    else:
                        pass
                y_position = each12+1
                x_position = x_summary/float(k)
                win_rate = "%.1f%%" % (win_time/float(k)*100)
                summary_x_position.append(x_position)
                summary_win_rate.append(win_rate)
                summary_k.append(k)
        cnt = Counter(summary_x_position)
        for w, v in cnt.iteritems():
            number_position = all_indexs(summary_x_position, w)
            for number5 in range(0, v):
                circles(w, each12+1+number5*0.3, 0.04*summary_k[number_position[number5]], '1', edgecolor='b')
                plt.text(w+0.05*summary_k[number_position[number5]], each12+1+number5*0.3-0.05, hero_type[number_position[number5]])
                plt.text(w+0.05*summary_k[number_position[number5]], each12+1+number5*0.3-0.15, summary_k[number_position[number5]])
                plt.text(w+0.05*summary_k[number_position[number5]], each12+1+number5*0.3+0.05, summary_win_rate[number_position[number5]])
    plt.show()


