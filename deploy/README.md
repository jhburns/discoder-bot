```text
$ ssh-keygen -t rsa -b 4096 -C "jburns867@gmail.com" -f ./.secrets/id_rsa
```

```text
$ ssh -i ./.secrets/id_rsa -l ubuntu (terraform output -raw ip)
```