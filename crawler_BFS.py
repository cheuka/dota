# -*-coding:utf8-*-

"""
Used beautifulsoup4
"""

import json
import const
from utility import *
import os
import re
import time
from bs4 import BeautifulSoup


import sys
reload(sys)
sys.setdefaultencoding('utf-8')


# if you have not found all match lists, mark it as False
FORCE_FIND_MATCH_LIST = False
FORCE_CACHE = True  # careful, it will pop out a lot of html cache files, only for debug mode
FORCE_CACHE_AUTOCLEAN = True  # with autoclean, the cached html will be cleaned after the whole has been processed


def get_entries(content, proc_league=None):
    reg = r'\?league_id=[0-9]{1,6}'
    league_re = re.compile(reg)
    league_list = re.findall(league_re, content)
    league_set = set(league_list)
    x = 0
    string_to_write = ''
    for league_id in league_set:
        string_to_write += 'http://www.dotamax.com/match/tour_matches/'+league_id+'\n'
        x += 1
    print 'You have found', x, 'leagues pages in this directory. Wrote to "saved_data/leagues_list.txt'
    # string_to_write = str(x) + string_to_write
    if not os.path.exists(const.FN_DATADIR):
        os.mkdir(const.FN_DATADIR)
    fp = open(const.FN_DATADIR+const.FN_LEAGUE_LIST, 'w+')
    fp.write(string_to_write)
    fp.close()


def proc_league(myurl):
    print 'processing:', myurl
    code, html = get_html(myurl)
    status = code // 100
    if not (status == 2 or status == 3):
        print 'Bad sublink, going to the next url...'
        return
    html = html.replace('\n', ' ')
    html = html.replace('\t', ' ')
    html_tree = etree.HTML(html.decode('utf-8'))
    mytitle_list = get_from_etree(html_tree, 'title')
    title_string = ''
    if mytitle_list:
        title_string = mytitle_list[0].text
        title_string = title_string.replace('<title>', ' ')
        title_string = title_string.replace('</title>', ' ')
        title_string = title_string.replace(u'-  Dotamax - 做国内第一游戏数据门户', ' ')
        title_string = title_string.replace('\n', ' ')
        title_string = title_string.strip()
        title_string = clear_illegal_chars(title_string)
        print 'league name:', title_string
    if not os.path.exists(const.FN_DATADIR+const.FN_LEAGUE_DIR):
        os.mkdir(const.FN_DATADIR+const.FN_LEAGUE_DIR)
    if not os.path.exists(const.FN_DATADIR+const.FN_LEAGUE_DIR+'/'+title_string):
        os.mkdir(const.FN_DATADIR+const.FN_LEAGUE_DIR+'/'+title_string)
    if not os.path.exists(const.FN_DATADIR+const.FN_LEAGUE_DIR+'/'+title_string+const.FN_MATCH_LIST):
        match_regex = r'/match/detail/[0-9]{9,11}'
        match_re = re.compile(match_regex)
        match_list = re.findall(match_re, html)
        match_set = set(match_list)
        page_num = 1
        print 'Processing: Page', page_num
        while True:
            print 'Processed Match Page', page_num
            page_num += 1
            code, html = get_html(myurl + const.URL_DOTAMAX_MATCHPAGE + str(page_num))
            status = code // 100
            if not (status == 2 or status == 3):
                print 'Bad match list query...'
                break
            match_list = re.findall(match_re, html)
            if not match_list or (match_list and match_list[0] in match_set):
                break
            tmp_set = set(match_list)
            match_set = match_set | tmp_set
        match_list_string = ''
        for i in match_set:
            match_list_string += i + '\n'
        fp = open(const.FN_DATADIR+const.FN_LEAGUE_DIR+'/'+title_string+const.FN_MATCH_LIST, 'w')
        fp.write(match_list_string)
        fp.close()
    # print 'You found', len(match_set), 'matches in this league'


def proc_league_list():
    if not os.path.exists(const.FN_DATADIR+const.FN_LEAGUE_LIST):
        print 'error...please rerun the whole program to generate leagues list'
        return None
    else:
        print 'Start Processing League List Cached'
        return get_list_from_file(const.FN_DATADIR+const.FN_LEAGUE_LIST)


def gen_league_list():
    print 'Generate League List from Beginning.'
    code, html = get_html(const.URL_DOTAMAX_TOUR)
    status = code // 100
    if status == 2 or status == 3:
        get_entries(html)
    else:
        print 'bad url link, program terminating...'


def proc_match_list(myfunc1=None, myfunc2=None):
    if not os.path.exists(const.FN_DATADIR+const.FN_LEAGUE_DIR):
        print 'Error, please rerun the script to generate match lists'
        return
    rootdir = const.FN_DATADIR+const.FN_LEAGUE_DIR
    if not os.path.exists(const.FN_DATADIR+const.FN_RESULT_DIR):
        # print 'Results already exists. Delete it before we can start moving. Exiting...'
        # return
        os.mkdir(const.FN_DATADIR+const.FN_RESULT_DIR)
    # mydatestamp = time.strftime('%Y%m%d%H%M%S', time.localtime(time.time()))
    # os.mkdir(const.FN_DATADIR+const.FN_RESULT_DIR+'/'+mydatestamp)
    counter = 0
    for parent, dirs, files in os.walk(rootdir):
        for dirname in dirs:
            print 'Now Processing', dirname
            if not os.path.exists(const.FN_DATADIR+const.FN_LEAGUE_DIR+'\\'+dirname+const.FN_MATCH_LIST):
                print const.FN_DATADIR+const.FN_LEAGUE_DIR+dirname+const.FN_MATCH_LIST
                print 'Error in finding match list file'
                return
            match_list = get_list_from_file(const.FN_DATADIR+const.FN_LEAGUE_DIR+'\/'+dirname+const.FN_MATCH_LIST)
            for i in match_list:
                match_id = re.sub(r'\/match\/detail\/', '', i)
                if myfunc1 and not os.path.exists(const.FN_DATADIR+const.FN_RESULT_DIR+ '/vision/res_'+match_id+ '.txt'):
                    myfunc1(match_id)
                '''
                if myfunc2 and not os.path.exists(const.FN_DATADIR+const.FN_RESULT_DIR+ '/log_events/res_'+match_id+ '.txt'):
                    myfunc2(match_id)
                '''
                counter += 1
    print 'Finished process of', counter, 'matches'


def proc_match_vision(match_id):
    """
    Now is getting vision
    :param match_id:
    :return:
    """
    print 'Processing match', match_id, 'for visions'
    # match_id = const.URL_DOTAMAX_PREFIX+'/match/detail/vision/'+match_id+'/'
    # print 'url:', match_id
    if FORCE_CACHE:
        if not os.path.exists(const.FN_DATADIR+const.FN_CACHED_HTML+match_id):
            myurl = 'http://www.dotabuff.com/matches/' + match_id + '/vision'
            code, html = get_html(myurl)
            fp = open(const.FN_DATADIR+const.FN_CACHED_HTML+match_id, 'w')
            fp.write(html)
            fp.close()
        else:
            fp = open(const.FN_DATADIR+const.FN_CACHED_HTML+match_id, 'r')
            html = fp.read()
            fp.close()
    else:
        myurl = 'http://www.dotabuff.com/matches/' + match_id + '/vision'
        code, html = get_html(myurl)
    soup = BeautifulSoup(html, 'lxml')  # need to include lxml to avoid warning from bs4

    # getting heros and players

    heros_dict = dict()  # the dict to store radiant and dire
    faction_radiants = soup.find_all('tr', {'class': 'faction-radiant'})
    faction_dires = soup.find_all('tr', {'class': 'faction-dire'})
    heros_dict['radiant'] = []
    heros_dict['dire'] = []

    for hero in faction_radiants:
        # player name:
        hero_dict = dict()
        player_td = hero.find('td', {'class': 'r-tab-player-name'})
        player_name = str(player_td.find('a', {'class': 'link-type-player'}).text)
        hero_dict['player_name'] = player_name
        # hero:
        hero_td = hero.find('td', {'class': 'r-tab-icon'})
        hero_name = hero_td.div.a.attrs['href']
        hero_name = hero_name.replace('-', ' ')
        hero_name = hero_name.replace('/heroes/', '')
        hero_dict['hero_name'] = hero_name
        # way:
        hero_dict['lane'] = player_td.div.span.acronym.text
        heros_dict['radiant'].append(hero_dict)

    for hero in faction_dires:
        # player name:
        hero_dict = dict()
        player_td = hero.find('td', {'class': 'r-tab-player-name'})
        player_name = str(player_td.find('a', {'class': 'link-type-player'}).text)
        hero_dict['player_name'] = player_name
        # hero:
        hero_td = hero.find('td', {'class': 'r-tab-icon'})
        hero_name = hero_td.div.a.attrs['href']
        hero_name = hero_name.replace('-', ' ')
        hero_name = hero_name.replace('/heroes/', '')
        hero_dict['hero_name'] = hero_name
        # way:
        hero_dict['lane'] = player_td.div.span.acronym.text
        heros_dict['dire'].append(hero_dict)

    # the details
    match_log = soup.find_all('div', {'class': 'match-log'})
    # match_visions = soup.find_all('div', {'class': 'vision-icon'})
    if len(match_log) == 0:  # or len(match_visions) == 0:
        print 'Missing Page on this match or Error in this HTML format for dotabuff'
        return
    all_events = match_log[0].find_all('div', {'class': 'event'}, False)

    '''
    # Getting all vision positions
    visions_dict = {}  # store the vision by tooltip id
    visions_missing_tooltip = []  # store the visions that does not have a tooltipid
    for vision in match_visions:
        vision_dict = dict()
        vision_dict['pos_style'] = vision.attrs['style']
        vision_dict['data_slider_min'] = vision.attrs['data-slider-min']
        vision_dict['data_slider_max'] = vision.attrs['data-slider-max']
        if 'data-hasqtip' in vision.attrs:
            tooltipid = vision.attrs['data-hasqtip']
            visions_dict[tooltipid] = vision_dict
            # print 'found tooltiped vision'
        else:
            visions_missing_tooltip.append(vision_dict)
            # print 'found missing vision'
    '''

    # check the final result
    winner = 'radiant'

    # Getting all events
    event_list = []
    for event in all_events:
        # event_text = event.text
        event_dict = dict()
        if not event.div or not event.div.div:
            continue
        event_dict['time'] = str(event.div.find('span', {'class': 'time'}).text)
        # print event.div.find('span', {'class': 'extras'})
        anchors = event.div.div.find_all('a')

        # find position style
        extras_span = event.find('span', {'class': 'extras'})
        if extras_span:
            tooltip_span = extras_span.find('span', {'class': 'tooltip-wrapper'})
            if tooltip_span:
                minimap = tooltip_span.find('span', {'class': 'minimap-tooltip'})
                if minimap and minimap.span:
                    position_text = str(minimap.span.attrs['style'])
                    # print 'position_text:', position_text
                    pos_list = re.findall(r'([0-9]+%)', position_text)
                    if len(pos_list) == 2:
                        event_dict['top'] = pos_list[0]
                        event_dict['left'] = pos_list[1]

        counter = 0
        event_targets = []
        event_dict['action'] = str(event.div.div.text)
        for item in anchors:
            if counter == 0:
                event_dict['host'] = str(item.text.strip().lower())
                if 'attrs' in item and 'class' in item.attrs:
                    if 'color-faction-dire' in item.attrs['class']:
                        event_dict['host_fraction'] = 'dire'
                    elif 'color-faction-radiant' in item.attrs['class']:
                        event_dict['host_fraction'] = 'radiant'
            elif counter == 1:
                event_dict['item'] = str(item.text.strip().lower())
            else:
                if item.img and 'alt' in item.img.attrs:
                    to_append = str(item.img.attrs['alt'].strip())
                    if len(to_append):
                        event_targets.append(to_append)
            counter += 1
            event_dict['action'] = str(re.sub(item.text.strip(), '', event_dict['action']).strip())
            if event_dict['action'] == 'The Dire have won the match':
                winner = 'dire'
        if len(event_targets):
            event_dict['targets'] = event_targets

        """ FOR DEBUG ONLY:
        sample_string = ''
        for k, v in event_dict.items():
            if isinstance(v, list) or isinstance(v, tuple):
                list_str = ''
                for i in v:
                    list_str += (i + ',')
            else:
                list_str = str(v)
            sample_string += (str(k) + ':' + str(list_str) + ';')
        # print sample_string
        """

        event_list.append(event_dict)

    # write the result into file as json
    if not os.path.exists(const.FN_DATADIR+const.FN_RESULT_DIR+'/vision'):
        os.mkdir(const.FN_DATADIR+const.FN_RESULT_DIR+'/vision')
    fp = open(const.FN_DATADIR+const.FN_RESULT_DIR+'/vision/res_'+match_id+'.txt', 'w+')
    json.dump({'heroes': heros_dict, 'vision': event_list, 'winner': winner}, fp)
    fp.close()

    '''
    if not os.path.exists(const.FN_DATADIR+const.FN_RESULT_DIR+'/vision_points'):
        os.mkdir(const.FN_DATADIR+const.FN_RESULT_DIR+'/vision_points')
    fp = open(const.FN_DATADIR+const.FN_RESULT_DIR+'/vision_points/res_'+match_id+'.txt', 'w+')
    json.dump(visions_missing_tooltip, fp)
    fp.close()
    '''

    # process autoclean for cache
    if FORCE_CACHE_AUTOCLEAN and FORCE_CACHE:
        if os.path.exists(const.FN_DATADIR+const.FN_CACHED_HTML+match_id):
            os.remove(const.FN_DATADIR+const.FN_CACHED_HTML+match_id)
    # to debug on one, uncomment the exit()
    # exit()


def proc_match_log(match_id):
    """
    Getting all event log
    :param match_id:
    :return:
    """
    print 'Processing match', match_id, 'for log'
    if FORCE_CACHE:
        if not os.path.exists(const.FN_DATADIR+const.FN_CACHED_HTML+'_log_'+match_id):
            myurl = 'http://www.dotabuff.com/matches/' + match_id + '/log'
            code, html = get_html(myurl)
            fp = open(const.FN_DATADIR+const.FN_CACHED_HTML+'_log_'+match_id, 'w')
            fp.write(html)
            fp.close()
        else:
            fp = open(const.FN_DATADIR+const.FN_CACHED_HTML+'_log_'+match_id, 'r')
            html = fp.read()
            fp.close()
    else:
        myurl = 'http://www.dotabuff.com/matches/' + match_id + '/log'
        code, html = get_html(myurl)
    soup = BeautifulSoup(html, 'lxml')  # need to include lxml to avoid warning from bs4

    match_log = soup.find_all('div', {'class': 'match-log'})
    if len(match_log) == 0:
        print 'Missing Page on this match or Error in this HTML format for dotabuff'
        return
    all_events = match_log[0].find_all('div', {'class': 'event'}, False)

    winner = 'radiant'

    # process event log
    event_list = []

    # start processing each event:
    for event in all_events:
        print 'text:', event.text
        if (not event.div) or (not event.div.div):
            print 'missing one...'
            continue
        event_dict = dict()
        event_dict['time'] = str(event.div.find('span', {'class': 'time'}).text)

        # distinguish the event types
        event_type = event.div.div.text
        if 'killed by' in event_type:
            event_dict['type'] = 'kill'
        elif 'killed' in event_type:
            event_dict['type'] = 'kill roshan'
        elif 'gets' in event_type:
            event_dict['type'] = 'get'
        elif 'got a 2x multi-kill'in event_type:
            event_dict['type'] = '2x kill'
        elif 'got a 3x multi-kill'in event_type:
            event_dict['type'] = '3x kill'
        elif 'got a 4x multi-kill'in event_type:
            event_dict['type'] = '4x kill'
        elif 'bought back' in event_type:
            event_dict['type'] = 'buyback'
        elif 'takes' in event_type:
            event_dict['type'] = 'take'
        elif 'has spawned' in event_type:
            event_dict['type'] = 'spawn'
        elif 'destroyed' in event_type or 'destroys' in event_type:
            event_dict['type'] = 'destroy'
        elif 'drops' in event_type or 'dropped' in event_type:
            event_dict['type'] = 'drop'
        elif 'activated' in event_type:
            event_dict['type'] = 'activate'
        elif 'placed' in event_type:
            event_dict['type'] = 'placed'
        elif 'have won the match' in event_type:
            event_dict['type'] = 'end of game'
        elif 'bottled' in event_type:
            event_dict['type'] = 'bottled'
        elif 'picked up' in event_type:
            event_dict['type'] = 'pickup'
        elif 'denies' in event_type or 'denied' in event_type:
            event_dict['type'] = 'deny'
        else:
            event_dict['type'] = 'unknown'

        if 'Top' in event.div.div.text:
            event_dict['position'] = 'Top'
        if 'Bottom' in event.div.div.text:
            event_dict['position'] = 'Bottom'
        if 'The Dire have won the match' in event.div.div.text:
            winner = 'dire'

        if not hasattr(event, 'div'):
            continue
        if not hasattr(event.div, 'div'):
            continue
        anchors = set(event.div.div.find_all('a'))
        spans = set(event.div.div.find_all('span'))
        items = anchors | spans
        counter = 0
        event_targets = []
        # print 'string:', str(event.div.div.text)  # for debug
        for item in items:
            if 'glyph' in item.attrs['class']:
                event_dict['glyph'] = True
            if counter == 0:
                host_name = 'host'
                if event_dict['type'] == 'kill':
                    host_name = 'victim'
                event_dict[host_name] = str(item.text.strip().lower())
                if 'attrs' in item and 'class' in item.attrs:
                    if 'color-faction-dire' in item.attrs['class']:
                        event_dict['host_fraction'] = 'dire'
                    elif 'color-faction-radiant' in item.attrs['class']:
                        event_dict['host_fraction'] = 'radiant'
                    else:
                        event_dict['host_fraction'] = 'neutral'
            elif counter == 1:
                host_name = 'host'
                if event_dict['type'] == 'kill':
                    host_name = 'killer'
                event_dict[host_name] = str(item.text.strip().lower())
            else:
                if hasattr(item, 'attrs') and 'href' in item.attrs and 'abilities' in item.attrs['href']:
                    event_dict['ability'] = str(item.img.attrs['alt'].strip())
                elif hasattr(item, 'img') and item.img and 'attrs' in item.img and 'alt' in item.img.attrs:
                    to_append = str(item.img.attrs['alt'].strip())
                    if len(to_append):
                        event_targets.append(to_append)
            counter += 1
            # event_dict['action'] = str(re.sub(item.text.strip(), '', event_dict['action']).strip())

        if len(event_targets):
            target_name = 'targets'
            if event_dict['type'] == 'kill':
                target_name = 'assistants'
            event_dict[target_name] = event_targets

        """ FOR DEBUG ONLY:"""
        sample_string = ''
        for k, v in event_dict.items():
            if isinstance(v, list) or isinstance(v, tuple):
                list_str = ''
                for i in v:
                    list_str += (i + ',')
            else:
                list_str = str(v)
            sample_string += (str(k) + ':' + str(list_str) + ';')
        print sample_string
        """ """

        event_list.append(event_dict)

    # end of iteration of events

    # process event log write to json file
    if not os.path.exists(const.FN_DATADIR+const.FN_RESULT_DIR+'/log_events'):
        os.mkdir(const.FN_DATADIR+const.FN_RESULT_DIR+'/log_events')
    fp = open(const.FN_DATADIR+const.FN_RESULT_DIR+'/log_events/res_'+match_id+'.txt', 'w+')
    json.dump({'events': event_list, 'winner': winner}, fp)
    fp.close()

    # exit()  # for debug, one time run

    # end of process, cleaning optionally
    if FORCE_CACHE_AUTOCLEAN and FORCE_CACHE:
        if os.path.exists(const.FN_DATADIR+const.FN_CACHED_HTML+'_log_'+match_id):
            os.remove(const.FN_DATADIR+const.FN_CACHED_HTML+'_log_'+match_id)



def main():
    """
    Driver function
    """
    if not os.path.exists(const.FN_DATADIR+const.FN_LEAGUE_LIST):
        gen_league_list()
    if (not os.listdir(const.FN_DATADIR+const.FN_LEAGUE_DIR)) or FORCE_FIND_MATCH_LIST:
        league_list = proc_league_list()
        if league_list:
            for league_url in league_list:
                proc_league(league_url)
    proc_match_list(proc_match_vision, proc_match_log)



# start from here as the main driver
main()
