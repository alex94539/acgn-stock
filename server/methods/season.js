'use strict';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { dbRankCompanyPrice } from '../../db/dbRankCompanyPrice';
import { dbRankCompanyProfit } from '../../db/dbRankCompanyProfit';
import { dbRankCompanyValue } from '../../db/dbRankCompanyValue';
import { dbRankUserWealth } from '../../db/dbRankUserWealth';
import { dbSeason } from '../../db/dbSeason';

Meteor.publish('currentSeason', function() {
  const observer1 = dbSeason
    .find({}, {
      sort: {
        beginDate: -1
      },
      limit: 1
    })
    .observeChanges({
      added: (id) => {
        this.added('variables', 'currentSeasonId', {
          value: id
        });
      },
      removed: () => {
        this.removed('variables', 'currentSeasonId');
      }
    });
  const observer2 = dbSeason
    .find({}, {
      sort: {
        beginDate: -1
      },
      limit: 2
    })
    .observeChanges({
      added: (id, fields) => {
        this.added('season', id, fields);
      },
      removed: (id) => {
        this.removed('season', id);
      }
    });

  this.onStop(() => {
    observer1.stop();
    observer2.stop();
  });
  this.ready();
});

Meteor.publish('adjacentSeason', function(seasonId) {
  check(seasonId, String);

  const specificSeasonData = dbSeason.findOne(seasonId);
  if (specificSeasonData) {
    this.added('season', specificSeasonData._id, specificSeasonData);
    const specificSeasonDataBeginDate = specificSeasonData.beginDate;
    const observer1 = dbSeason
      .find(
        {
          beginDate: {
            $gt: specificSeasonDataBeginDate
          }
        },
        {
          sort: {
            beginDate: 1
          },
          limit: 1
        }
      )
      .observeChanges({
        added: (id, fields) => {
          this.added('season', id, fields);
        },
        removed: (id) => {
          this.removed('season', id);
        }
      });
    const observer2 = dbSeason
      .find(
        {
          beginDate: {
            $lt: specificSeasonDataBeginDate
          }
        },
        {
          sort: {
            beginDate: -1
          },
          limit: 1
        }
      )
      .observeChanges({
        added: (id, fields) => {
          this.added('season', id, fields);
        },
        removed: (id) => {
          this.removed('season', id);
        }
      });
    this.onStop(() => {
      observer1.stop();
      observer2.stop();
    });
  }
  this.ready();
});

Meteor.publish('rankListBySeasonId', function(seasonId) {
  return [
    dbRankCompanyPrice.find({seasonId}),
    dbRankCompanyProfit.find({seasonId}),
    dbRankCompanyValue.find({seasonId}),
    dbRankUserWealth.find({seasonId})
  ];
});