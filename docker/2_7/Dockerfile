FROM node:10.16.0-alpine as node_build

RUN set -eux \
  ; apk add git

COPY . /workspace

WORKDIR /workspace
RUN set -eux \
  ; yarn install --frozen-lockfile \
  ; yarn list --depth=0 \
  ; yarn run lint \
  ; yarn run format \
  ; git diff --name-status ./static \
  ; git diff-files --quiet ./static || (echo 'The files above have not been formatted!' && (exit 1)) \
  ; yarn run test \
  ; ls -lah node_modules \
  ; yarn run build

FROM continuumio/anaconda:latest as python_build

COPY --from=node_build /workspace /workspace

ENV PATH="/opt/conda/bin/:${PATH}"

WORKDIR /workspace
RUN set -eux \
  ; pip install six \
  ; pip install lxml \
  ; pip install isort \
  ; pip install -r docs/source/requirements.txt \
  ; python setup.py develop \
  ; python setup.py build_sphinx \
  ; isort --recursive -c -vb setup.py dtale tests \
  ; export TZ=America/New_York \
  ; python setup.py test \
  ; python setup.py bdist_egg

FROM continuumio/anaconda:latest

COPY --from=python_build /workspace/dist/*.egg /app/

WORKDIR /app

# Copy in demo csv data
COPY ./demo .

# Expose dtale port (match port in cli)
EXPOSE 3000

RUN set -eux \
  ; . /root/.bashrc \
  ; easy_install dtale-1.0.0-py2.7.egg

RUN ln -sf /bin/bash /bin/sh
ENV PATH="/opt/conda/bin/:${PATH}"

CMD ["dtale", "--port",  "3000", "--csv-path", "./demo.csv"]

