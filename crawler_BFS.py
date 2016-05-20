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


def proc_match_list(func_list=None):
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
                if func_list:
                    for func in func_list:
                        if not os.path.exists(const.FN_DATADIR+const.FN_RESULT_DIR+'/res_' +
                                              match_id):
                            os.mkdir(const.FN_DATADIR+const.FN_RESULT_DIR+'/res_' + match_id)
                        filename = (const.FN_DATADIR+const.FN_RESULT_DIR+'/res_' +
                                    match_id + '/' + func.__name__ + '.json')
                        if func and not os.path.exists(filename):
                            try:
                                func(match_id, filename)
                            except IndexError:
                                print 'Error in dotabuff page, skipping...'
                                continue
                counter += 1
    print 'Finished process of', counter, 'matches'


def proc_hero_info(hero):
    """
    Process the hero info for match_overview
    :param hero:
    :return:
    """
    hero_dict = dict()
    player_td = hero.find('td', {'class': 'cell-match-player-name'})
    player_info_anchor = player_td.find_all('a', {'class': 'link-type-player'})[0]
    hero_dict['player_name'] = str(player_info_anchor.text)
    hero_dict['player_id'] = str(player_info_anchor.attrs['href'])

    # hero:
    hero_div = hero.find_all('div', {'class': 'image-container-hero'})[0]
    hero_dict['hero_name'] = hero_div.a.attrs['href']

    # lane:
    hero_dict['lane'] = player_td.div.span.acronym.text

    # hero_info:
    hero_group_1 = hero.find_all('td', {'class': 'r-group-1'})
    hero_group_2 = hero.find_all('td', {'class': 'r-group-2'})
    hero_group_3 = hero.find_all('td', {'class': 'r-group-3'})

    hero_dict['level'] = str(hero_group_1[0].text)
    hero_dict['kills'] = str(hero_group_1[1].text)
    hero_dict['deaths'] = str(hero_group_1[2].text)
    hero_dict['assists'] = str(hero_group_1[3].text)
    hero_dict['kda'] = str(hero_group_1[4].text)

    hero_dict['gold'] = str(hero_group_2[0].text)
    hero_dict['lh'] = str(hero_group_2[1].text)
    hero_dict['dn'] = str(hero_group_2[2].text)
    hero_dict['xpm'] = str(hero_group_2[3].text)
    hero_dict['gpm'] = str(hero_group_2[4].text)

    hero_dict['hd'] = str(hero_group_3[0].text)
    hero_dict['hh'] = str(hero_group_3[1].text)
    hero_dict['td'] = str(hero_group_3[2].text)

    return hero_dict


def proc_force_cache(myurl, cache_filename):
    if FORCE_CACHE:
        if not os.path.exists():
            code, html = get_html(myurl)
            fp = open(cache_filename, 'w')
            fp.write(html)
            fp.close()
        else:
            fp = open(cache_filename, 'r')
            html = fp.read()
            fp.close()
    else:
        code, html = get_html(myurl)
    return html


def match_overview(match_id, filename):
    print 'Processing match', match_id, 'for overview'
    myurl = 'http://www.dotabuff.com/matches/' + match_id
    cache_filename = const.FN_DATADIR+const.FN_CACHED_HTML+match_id
    html = proc_force_cache(myurl, cache_filename)
    soup = BeautifulSoup(html, 'lxml')  # need to include lxml to avoid warning from bs4

    # getting match result
    result_text = str(soup.find_all('div', {'class': 'match-result'})[0].text)

    if result_text.strip() == 'Radiant Victory':
        winner = 'radiant'
    else:
        winner = 'dire'

    # getting factions
    faction_dict = dict()
    faction_dict['dire'] = dict()
    faction_dict['radiant'] = dict()

    radiants = soup.find_all('section', {'class': 'radiant'})[0]
    dires = soup.find_all('section', {'class': 'dire'})[0]

    faction_dict['dire']['team_id'] = str(dires.header.a.attrs['href'])
    faction_dict['dire']['team_name'] = str(dires.header.text)
    faction_dict['radiant']['team_id'] = str(radiants.header.a.attrs['href'])
    faction_dict['radiant']['team_name'] = str(radiants.header.text)
    # getting heros and players

    faction_dict['dire']['heroes'] = []
    faction_dict['radiant']['heroes'] = []

    radiant_heroes = radiants.find_all('tr', {'class': 'faction-radiant'})
    dire_heroes = dires.find_all('tr', {'class': 'faction-dire'})

    # process heros from both sides
    for hero in radiant_heroes:
        # player name:
        hero_dict = proc_hero_info(hero)

        # append finally
        faction_dict['radiant']['heroes'].append(hero_dict)

    for hero in dire_heroes:
        # player name:
        hero_dict = proc_hero_info(hero)

        # append finally
        faction_dict['dire']['heroes'].append(hero_dict)

    # write the result into file as json
    fp = open(filename, 'w+')
    json.dump({'factions': faction_dict, 'winner': winner}, fp, False, True, True, True, None, 4)
    fp.close()

    # process autoclean for cache
    if FORCE_CACHE_AUTOCLEAN and FORCE_CACHE:
        if os.path.exists(const.FN_DATADIR+const.FN_CACHED_HTML+match_id):
            os.remove(const.FN_DATADIR+const.FN_CACHED_HTML+match_id)
    # to debug on one, uncomment the exit()
    # exit()


def match_vision(match_id, filename):
    """
    :param match_id:
    :param filename:
    :return:
    """
    print 'Processing match', match_id, 'for visions'
    # match_id = const.URL_DOTAMAX_PREFIX+'/match/detail/vision/'+match_id+'/'
    myurl = 'http://www.dotabuff.com/matches/' + match_id + '/vision'
    cache_filename = const.FN_DATADIR+const.FN_CACHED_HTML+match_id
    html = proc_force_cache(myurl, cache_filename)

    soup = BeautifulSoup(html, 'lxml')  # need to include lxml to avoid warning from bs4

    # the details
    match_log = soup.find_all('div', {'class': 'match-log'})
    # match_visions = soup.find_all('div', {'class': 'vision-icon'})
    if len(match_log) == 0:  # or len(match_visions) == 0:
        print 'Missing Page on this match or Error in this HTML format for dotabuff'
        return
    all_events = match_log[0].find_all('div', {'class': 'event'}, False)

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
    '''
    if not os.path.exists(const.FN_DATADIR+const.FN_RESULT_DIR+'/match_vision'):
        os.mkdir(const.FN_DATADIR+const.FN_RESULT_DIR+'/match_vision')
    '''
    fp = open(filename, 'w+')
    json.dump({'match_vision': event_list}, fp, False, True, True, True, None, 4)
    fp.close()

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
    fp = open(const.FN_DATADIR+const.FN_RESULT_DIR+'/log_events/res_'+match_id+'.json', 'w+')
    json.dump({'events': event_list, 'winner': winner}, fp, False, True, True, True, None, 4)
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
    func_list = [match_overview, match_vision]
    if not os.path.exists(const.FN_DATADIR+const.FN_LEAGUE_LIST):
        gen_league_list()
    if (not os.listdir(const.FN_DATADIR+const.FN_LEAGUE_DIR)) or FORCE_FIND_MATCH_LIST:
        league_list = proc_league_list()
        if league_list:
            for league_url in league_list:
                proc_league(league_url)
    proc_match_list(func_list)



# start from here as the main driver
main()
