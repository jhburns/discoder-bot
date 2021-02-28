FROM racket/racket:8.0-full

WORKDIR /home/

RUN echo '#lang racket\n(display "Hello, World!\n")' > hello.rkt

CMD ["racket", "-t", "hello.rkt"]
