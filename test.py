from utility import *


def test_file():
    fp = open('random.txt', 'a+')
    print_and_write('test\ntest', fp)
    fp.close()


def test_failing_url():
    myurl = 'http://www.dotamax.com/match/tour_matches/?league_id=4554&skill=&ladder=&p=8'
    code, html = getHtml(myurl)
    print 'code:', code, '\nhtml:', html


test_failing_url()