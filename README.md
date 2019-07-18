# About

Web interface for the [BCdatabaser](https://github.com/molbiodiv/bcdatabaser) pipeline.
Public instance hosted at: https://bcdatabaser.molecular.eco

## Logo
The current logo is designed by [@mirzazulfan](https://github.com/mirzazulfan).
Thanks a lot Mirza!
![Logo](public/img/logo.svg)

## Hosting your own instance

Feel free to host your own instance of the BCdatabaser web server.
To do so use the `docker-compose.yml` included in this repository.
Don't forget to deposit a file `.zenodo_token` with your zenodo token.

We recommend adding the following two entries to your host `crontab` to clean old job data every day and update the local NCBI Taxonomy dump once a week (see [issue #15](https://github.com/molbiodiv/bcdatabaser/issues/15)).
Adjust the path to your folder containing the `docker_compose.yml` and the desired time and frequency of execution to your needs.

```
# m h  dom mon dow   command
10     5     *     *     *     cd /home/bcd/bcdatabaser_prod/ && docker-compose exec web find /tmp -maxdepth 1 -type d -ctime +2 -name "tmp-*" -exec rm -rf {} +
30     3     *     *     2     cd /home/bcd/bcdatabaser_prod/ && docker-compose exec web bash -c "cd /NCBI-Taxonomy/ && perl make_taxid_indizes.pl && cd /Krona/KronaTools/ && ./updateTaxonomy.sh"
```

## LICENSE

This software is licensed under [MIT](./LICENSE). Be aware that the libraries and external programs are licensed separately (possibly under different licenses).

## Changes
 - 1.0.0 <2019-07-15> Initial stable release

