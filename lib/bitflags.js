const JOB_TYPE = {
    DESKTOP: 1,
    REAL_DEVICE: 2,
    VIRTUAL_DEVICE: 4,
    LIVE: 8,
    AUTOMATED: 16,
    WEB: 32,
    APP: 64
}

/* Need:
- [ ] RDC web test
- [x] RDC app test
- [ ] RDC espresso/xcui test
- [ ] desktop VDC test
- [ ] emusim VDC test
- [ ] LIVE for all the above?
*/

const AUTOMATED_RDC = (JOB_TYPE.APP & JOB_TYPE.REAL_DEVICE & JOB_TYPE.AUTOMATED)

const AUTOMATED_DESKTOP = (JOB_TYPE.DESKTOP & JOB_TYPE.AUTOMATED)

export { JOB_TYPE,  AUTOMATED_RDC, AUTOMATED_DESKTOP}