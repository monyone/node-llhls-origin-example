import express from 'express';
import cors from 'cors';

import M3U8 from '@monyone/ts-fragmenter'

const m3u8 = new M3U8({ 
  length: 4,
  lowLatencyMode: false,
  partTarget: 0.3,
});
process.stdin.pipe(m3u8)

const app = express()

app.use(cors());

app.listen(3000, () => {
  console.log("Start on port 3000.")
});

app.get('/manifest.m3u8', (req: express.Request, res: express.Response) => {
  const { _HLS_msn, _HLS_part } = req.query;

  if (_HLS_msn && _HLS_part) {
    const msn = Number.parseInt(_HLS_msn as string);
    const part = Number.parseInt(_HLS_part as string);

    if (m3u8.isFulfilledPartial(msn, part)) {
      res.set('Content-Type', 'application/vnd.apple.mpegurl')
      res.send(m3u8.getManifest());
    } else {
      m3u8.addPartialCallback(msn, part, () => {
        res.set('Content-Type', 'application/vnd.apple.mpegurl')
        res.send(m3u8.getManifest());
      })
    }
  } else if (_HLS_msn) {
    const msn = Number.parseInt(_HLS_msn as string);
    const part = 0;

    if (m3u8.isFulfilledPartial(msn, part)) {
      res.set('Content-Type', 'application/vnd.apple.mpegurl')
      res.send(m3u8.getManifest());
    } else {
      m3u8.addPartialCallback(msn, part, () => {
        res.set('Content-Type', 'application/vnd.apple.mpegurl')
        res.send(m3u8.getManifest());
      })
    }
  } else {
    res.set('Content-Type', 'application/vnd.apple.mpegurl')
    res.send(m3u8.getManifest());
  }
})

app.get('/segment', (req: express.Request, res: express.Response) => {
  const { msn } = req.query;
  const _msn = Number.parseInt(msn as string)

  if (!m3u8.inRangeSegment(_msn)) {
    res.status(404).end();
    return;
  }

  if (m3u8.isFulfilledSegment(_msn)) {
    res.set('Content-Type', 'video/mp2t');
    res.send(m3u8.getSegment(_msn));
  } else {
    m3u8.addSegmentCallback(_msn, () => {
      res.set('Content-Type', 'video/mp2t');
      res.send(m3u8.getSegment(_msn));
    });
  }
})

app.get('/part', (req: express.Request, res: express.Response) => {
  const { msn, part } = req.query;

  const _msn = Number.parseInt(msn as string);
  const _part = Number.parseInt(part as string);

  if (!m3u8.inRangePartial(_msn, _part)) {
    res.status(404).end();
    return;
  }

  if (m3u8.isFulfilledPartial(_msn, _part)) {
    res.set('Content-Type', 'video/mp2t');
    res.send(m3u8.getPartial(_msn, _part));
  } else {
    m3u8.addPartialCallback(_msn, _part, () => {
      res.set('Content-Type', 'video/mp2t');
      res.send(m3u8.getPartial(_msn, _part));
    })
  }
})
