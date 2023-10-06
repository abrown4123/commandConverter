using nvm (node version manager)
installed via script
download 20.8.0
`nvm ls`
`nvm help`
`nvm alias default 20.8.0`

20.8.0 will be the next LTS version in 6 months iirc. also some nice improvements. 

2023-oct-06
working on getting the job assets all wrapped up. Ideally a zip file.

Need a way to test if an ID is rdc or vdc. at the moment it looks like this if you mistakenly pass in a VDC job to the readline. to the end user an ID is an ID. need to just do the heavy lifting for them. 

```
real args [ 'max.dobeck.TAM', '******' ]
Input Job ID: b7455b8de91f41608d69c2aaea18396a
{
  message: "Job 'b7455b8de91f41608d69c2aaea18396a' not found",
  code: 'JOB_NOT_FOUND'
}```