cmake_minimum_required(VERSION 3.16)
project(neurofhe_openfhe_ckks_demo LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(OpenFHE REQUIRED)

add_executable(openfhe_ckks_linear_demo openfhe_ckks_linear_demo.cpp)
target_link_libraries(openfhe_ckks_linear_demo PRIVATE OPENFHEpke OPENFHEcore)
