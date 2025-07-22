#!/usr/bin/env python
from __future__ import print_function

from setuptools import find_packages, setup


def read_file(path):
    # if this fails on windows then add the following environment variable (PYTHONUTF8=1)
    with open(path) as contents:
        return contents.read()


# Convert Markdown to RST for PyPI
# http://stackoverflow.com/a/26737672
try:
    import pypandoc

    pypandoc_func = (
        pypandoc.convert_file if hasattr(pypandoc, "convert_file") else pypandoc.convert
    )
    long_description = pypandoc_func("DESCRIPTION.md", "rst")
except (IOError, ImportError, OSError):
    long_description = read_file("DESCRIPTION.md")


setup(
    name="dtale",
    version="3.18.0",
    author="MAN Alpha Technology",
    author_email="ManAlphaTech@man.com",
    description="Web Client for Visualizing Pandas Objects",
    license="LGPL",
    long_description=long_description,
    keywords=["numeric", "pandas", "visualization", "flask"],
    url="https://github.com/man-group/dtale",
    install_requires=read_file("requirements.txt").splitlines(),
    extras_require={
        "arctic": ["arctic <= 1.79.4"],
        "arcticdb": ["arcticdb"],
        "dash-bio": [
            "ParmEd==3.4.3; python_version == '3.6'",
            "dash-bio; python_version > '3.0'",
            "dash-bio==0.7.1; python_version == '2.7'",
        ],
        "ngrok": ["flask-ngrok; python_version > '3.0'"],
        "r": ["rpy2; python_version > '3.0'"],
        "redis": read_file("requirements-redis.txt").splitlines(),
        "streamlit": ["streamlit"],
        "swifter": ["swifter"],
        "tests": read_file("requirements-test.txt").splitlines(),
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "License :: OSI Approved :: GNU Library or Lesser General Public License (LGPL)",
        "Operating System :: OS Independent",
        "Intended Audience :: Science/Research",
        "Programming Language :: Python",
        "Topic :: Scientific/Engineering",
        "Programming Language :: Python :: 2.7",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    packages=find_packages(exclude=["tests*", "script*"]),
    package_data={
        "dtale": [
            "dash_application/components/*",
            "static/dist/*",
            "static/dash/*",
            "static/css/*",
            "static/fonts/*",
            "static/images/*",
            "static/images/**/*",
            "static/maps/*",
            "templates/**/*",
            "templates/**/**/*",
            "translations/*",
        ]
    },
    entry_points={
        "console_scripts": [
            "dtale = dtale.cli.script:main",
            "dtale-streamlit = dtale.cli.streamlit_script:main",
        ]
    },
    zip_safe=False,
)
